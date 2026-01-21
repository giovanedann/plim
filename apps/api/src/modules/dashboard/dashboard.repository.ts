import type {
  CategoryBreakdownItem,
  DashboardQuery,
  IncomeExpensesDataPoint,
  InstallmentForecastMonth,
  PaymentBreakdownItem,
  SalaryTimelineDataPoint,
  SavingsRateDataPoint,
  TimelineDataPoint,
  TimelineGroupBy,
} from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ExpenseRow {
  date: string
  amount_cents: number
  payment_method: string
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  installment_group_id: string | null
  installment_total: number | null
  installment_current: number | null
  description: string
}

interface SalaryRow {
  amount_cents: number
  effective_from: string
}

export class DashboardRepository {
  constructor(private supabase: SupabaseClient) {}

  async getExpensesForPeriod(userId: string, query: DashboardQuery): Promise<ExpenseRow[]> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(`
        date,
        amount_cents,
        payment_method,
        category_id,
        category:category_id (name, color, icon),
        installment_group_id,
        installment_total,
        installment_current,
        description
      `)
      .eq('user_id', userId)
      .gte('date', query.start_date)
      .lte('date', query.end_date)
      .order('date', { ascending: true })

    if (error || !data) return []

    return data.map((row) => {
      const category = row.category as unknown as {
        name: string
        color: string | null
        icon: string | null
      } | null
      return {
        date: row.date,
        amount_cents: row.amount_cents,
        payment_method: row.payment_method,
        category_id: row.category_id,
        category_name: category?.name ?? 'Sem categoria',
        category_color: category?.color ?? null,
        category_icon: category?.icon ?? null,
        installment_group_id: row.installment_group_id,
        installment_total: row.installment_total,
        installment_current: row.installment_current,
        description: row.description,
      }
    })
  }

  async getSalariesForPeriod(userId: string, query: DashboardQuery): Promise<SalaryRow[]> {
    const { data, error } = await this.supabase
      .from('salary_history')
      .select('amount_cents, effective_from')
      .eq('user_id', userId)
      .lte('effective_from', query.end_date)
      .order('effective_from', { ascending: true })

    if (error || !data) return []

    return data as SalaryRow[]
  }

  async getFutureInstallments(
    userId: string,
    currentDate: string
  ): Promise<{ amount_cents: number; date: string }[]> {
    const { data, error } = await this.supabase
      .from('expense')
      .select('amount_cents, date')
      .eq('user_id', userId)
      .not('installment_group_id', 'is', null)
      .gte('date', currentDate)
      .order('date', { ascending: true })

    if (error || !data) return []

    return data.map((row) => ({
      amount_cents: row.amount_cents,
      date: row.date,
    }))
  }

  aggregateExpensesByTimeline(
    expenses: ExpenseRow[],
    groupBy: TimelineGroupBy
  ): TimelineDataPoint[] {
    const grouped = new Map<string, number>()

    for (const expense of expenses) {
      const key = this.getTimelineKey(expense.date, groupBy)
      const current = grouped.get(key) ?? 0
      grouped.set(key, current + expense.amount_cents)
    }

    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  aggregateByCategory(expenses: ExpenseRow[], total: number): CategoryBreakdownItem[] {
    const grouped = new Map<
      string,
      { name: string; color: string | null; icon: string | null; amount: number }
    >()

    for (const expense of expenses) {
      const current = grouped.get(expense.category_id)
      if (current) {
        current.amount += expense.amount_cents
      } else {
        grouped.set(expense.category_id, {
          name: expense.category_name,
          color: expense.category_color,
          icon: expense.category_icon,
          amount: expense.amount_cents,
        })
      }
    }

    return Array.from(grouped.entries())
      .map(([category_id, data]) => ({
        category_id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  aggregateByPaymentMethod(expenses: ExpenseRow[], total: number): PaymentBreakdownItem[] {
    const grouped = new Map<string, number>()

    for (const expense of expenses) {
      const current = grouped.get(expense.payment_method) ?? 0
      grouped.set(expense.payment_method, current + expense.amount_cents)
    }

    return Array.from(grouped.entries())
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  calculateMonthlyIncomeExpenses(
    expenses: ExpenseRow[],
    salaries: SalaryRow[],
    startDate: string,
    endDate: string
  ): IncomeExpensesDataPoint[] {
    const result: IncomeExpensesDataPoint[] = []
    const startMonth = startDate.slice(0, 7)
    const endMonth = endDate.slice(0, 7)

    const expensesByMonth = new Map<string, number>()
    for (const expense of expenses) {
      const month = expense.date.slice(0, 7)
      const current = expensesByMonth.get(month) ?? 0
      expensesByMonth.set(month, current + expense.amount_cents)
    }

    let currentMonth = startMonth
    while (currentMonth <= endMonth) {
      const income = this.getSalaryForMonth(salaries, currentMonth)
      const expensesTotal = expensesByMonth.get(currentMonth) ?? 0

      result.push({
        month: currentMonth,
        income,
        expenses: expensesTotal,
      })

      currentMonth = this.nextMonth(currentMonth)
    }

    return result
  }

  calculateSavingsRate(incomeExpenses: IncomeExpensesDataPoint[]): SavingsRateDataPoint[] {
    return incomeExpenses.map(({ month, income, expenses }) => ({
      month,
      rate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    }))
  }

  formatSalaryTimeline(salaries: SalaryRow[]): SalaryTimelineDataPoint[] {
    return salaries.map((s) => ({
      date: s.effective_from,
      amount: s.amount_cents,
    }))
  }

  calculateInstallmentForecast(
    installments: {
      amount_cents: number
      date: string
    }[],
    months: number
  ): InstallmentForecastMonth[] {
    const totals = new Map<string, number>()

    for (const inst of installments) {
      const month = inst.date.slice(0, 7)
      const current = totals.get(month) ?? 0
      totals.set(month, current + inst.amount_cents)
    }

    const sortedMonths = Array.from(totals.keys()).sort().slice(0, months)

    return sortedMonths.map((month) => ({
      month,
      total: totals.get(month) ?? 0,
    }))
  }

  private getTimelineKey(date: string, groupBy: TimelineGroupBy): string {
    switch (groupBy) {
      case 'day':
        return date
      case 'week': {
        const d = new Date(date)
        const dayOfWeek = d.getUTCDay()
        const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        d.setUTCDate(diff)
        return d.toISOString().slice(0, 10)
      }
      case 'month':
        return date.slice(0, 7)
    }
  }

  private getSalaryForMonth(salaries: SalaryRow[], month: string): number {
    const firstOfMonth = `${month}-01`
    let activeSalary = 0

    for (const salary of salaries) {
      if (salary.effective_from <= firstOfMonth) {
        activeSalary = salary.amount_cents
      } else {
        break
      }
    }

    return activeSalary
  }

  private nextMonth(month: string): string {
    const parts = month.split('-').map(Number)
    const year = parts[0] ?? 0
    const m = parts[1] ?? 0
    const nextM = m === 12 ? 1 : m + 1
    const nextY = m === 12 ? year + 1 : year
    return `${nextY}-${String(nextM).padStart(2, '0')}`
  }
}
