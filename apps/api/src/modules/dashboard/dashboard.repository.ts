import type {
  CategoryBreakdownItem,
  CreditCardBreakdownItem,
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

interface ExpenseWithCreditCardRow {
  date: string
  amount_cents: number
  credit_card_id: string | null
  credit_card_name: string | null
  credit_card_color: string | null
  credit_card_bank: string | null
  credit_card_flag: string | null
}

interface SalaryRow {
  amount_cents: number
  effective_from: string
}

export class DashboardRepository {
  constructor(private supabase: SupabaseClient) {}

  async getExpensesForPeriod(userId: string, query: DashboardQuery): Promise<ExpenseRow[]> {
    const results: ExpenseRow[] = []

    // Get non-recurrent expenses within the date range (one-time + installments)
    const { data: regularExpenses, error: regularError } = await this.supabase
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
      .eq('is_recurrent', false)
      .gte('date', query.start_date)
      .lte('date', query.end_date)
      .order('date', { ascending: true })

    if (!regularError && regularExpenses) {
      for (const row of regularExpenses) {
        const category = row.category as unknown as {
          name: string
          color: string | null
          icon: string | null
        } | null
        results.push({
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
        })
      }
    }

    // Get recurrent expenses and project them into the queried period
    const { data: recurrentExpenses, error: recurrentError } = await this.supabase
      .from('expense')
      .select(`
        amount_cents,
        payment_method,
        category_id,
        category:category_id (name, color, icon),
        description,
        recurrence_day,
        recurrence_start,
        recurrence_end
      `)
      .eq('user_id', userId)
      .eq('is_recurrent', true)

    if (!recurrentError && recurrentExpenses) {
      const mapped = recurrentExpenses.map((row) => {
        const category = row.category as unknown as {
          name: string
          color: string | null
          icon: string | null
        } | null
        return {
          amount_cents: row.amount_cents as number,
          payment_method: row.payment_method as string,
          category_id: row.category_id as string,
          category,
          description: row.description as string,
          recurrence_day: row.recurrence_day as number,
          recurrence_start: row.recurrence_start as string,
          recurrence_end: row.recurrence_end as string | null,
        }
      })
      const projectedRecurrent = this.projectRecurrentExpensesForPeriod(
        mapped,
        query.start_date,
        query.end_date
      )
      results.push(...projectedRecurrent)
    }

    return results.sort((a, b) => a.date.localeCompare(b.date))
  }

  private projectRecurrentExpensesForPeriod(
    recurrentExpenses: Array<{
      amount_cents: number
      payment_method: string
      category_id: string
      category: { name: string; color: string | null; icon: string | null } | null
      description: string
      recurrence_day: number
      recurrence_start: string
      recurrence_end: string | null
    }>,
    startDate: string,
    endDate: string
  ): ExpenseRow[] {
    const results: ExpenseRow[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (const expense of recurrentExpenses) {
      const recurrenceStart = new Date(expense.recurrence_start)
      const recurrenceEnd = expense.recurrence_end ? new Date(expense.recurrence_end) : null

      // Iterate through each month in the query period
      const current = new Date(start.getFullYear(), start.getMonth(), expense.recurrence_day)

      // If the recurrence day is before the start of the period, move to next month
      if (current < start) {
        current.setMonth(current.getMonth() + 1)
      }

      while (current <= end) {
        // Check if this date is within the recurrence bounds
        if (current >= recurrenceStart && (!recurrenceEnd || current <= recurrenceEnd)) {
          results.push({
            date: current.toISOString().slice(0, 10),
            amount_cents: expense.amount_cents,
            payment_method: expense.payment_method,
            category_id: expense.category_id,
            category_name: expense.category?.name ?? 'Sem categoria',
            category_color: expense.category?.color ?? null,
            category_icon: expense.category?.icon ?? null,
            installment_group_id: null,
            installment_total: null,
            installment_current: null,
            description: expense.description,
          })
        }
        current.setMonth(current.getMonth() + 1)
      }
    }

    return results
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

  async getFutureExpenses(
    userId: string,
    currentDate: string,
    months = 6
  ): Promise<{ amount_cents: number; date: string }[]> {
    const results: { amount_cents: number; date: string }[] = []

    const { data: regularExpenses, error: regularError } = await this.supabase
      .from('expense')
      .select('amount_cents, date')
      .eq('user_id', userId)
      .eq('is_recurrent', false)
      .gte('date', currentDate)
      .order('date', { ascending: true })

    if (!regularError && regularExpenses) {
      for (const row of regularExpenses) {
        results.push({
          amount_cents: row.amount_cents,
          date: row.date,
        })
      }
    }

    const { data: recurringExpenses, error: recurringError } = await this.supabase
      .from('expense')
      .select('amount_cents, recurrence_day, recurrence_start, recurrence_end')
      .eq('user_id', userId)
      .eq('is_recurrent', true)

    if (!recurringError && recurringExpenses) {
      const projectedRecurring = this.projectRecurringExpenses(
        recurringExpenses,
        currentDate,
        months
      )
      results.push(...projectedRecurring)
    }

    return results
  }

  private projectRecurringExpenses(
    recurringExpenses: {
      amount_cents: number
      recurrence_day: number
      recurrence_start: string
      recurrence_end: string | null
    }[],
    currentDate: string,
    months: number
  ): { amount_cents: number; date: string }[] {
    const results: { amount_cents: number; date: string }[] = []
    const current = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setMonth(endDate.getMonth() + months)

    for (const expense of recurringExpenses) {
      const recurrenceStart = new Date(expense.recurrence_start)
      const recurrenceEnd = expense.recurrence_end ? new Date(expense.recurrence_end) : null

      const iterDate = new Date(current.getFullYear(), current.getMonth(), expense.recurrence_day)

      if (iterDate < current) {
        iterDate.setMonth(iterDate.getMonth() + 1)
      }

      while (iterDate < endDate) {
        if (iterDate >= recurrenceStart && (!recurrenceEnd || iterDate <= recurrenceEnd)) {
          results.push({
            amount_cents: expense.amount_cents,
            date: iterDate.toISOString().slice(0, 10),
          })
        }
        iterDate.setMonth(iterDate.getMonth() + 1)
      }
    }

    return results
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

  async getExpensesWithCreditCards(
    userId: string,
    query: DashboardQuery
  ): Promise<ExpenseWithCreditCardRow[]> {
    // Query expenses - only credit/debit card payments
    const { data: expenses, error: expensesError } = await this.supabase
      .from('expense')
      .select('date, amount_cents, credit_card_id')
      .eq('user_id', userId)
      .in('payment_method', ['credit_card', 'debit_card'])
      .gte('date', query.start_date)
      .lte('date', query.end_date)
      .order('date', { ascending: true })

    if (expensesError || !expenses) return []

    // Get unique credit card IDs
    const creditCardIds = [
      ...new Set(expenses.map((e) => e.credit_card_id).filter((id): id is string => id !== null)),
    ]

    // Query credit cards separately
    const creditCardsMap = new Map<
      string,
      { name: string; color: string; bank: string; flag: string }
    >()

    if (creditCardIds.length > 0) {
      const { data: creditCards } = await this.supabase
        .from('credit_card')
        .select('id, name, color, bank, flag')
        .in('id', creditCardIds)

      if (creditCards) {
        for (const card of creditCards) {
          creditCardsMap.set(card.id, {
            name: card.name,
            color: card.color,
            bank: card.bank,
            flag: card.flag,
          })
        }
      }
    }

    return expenses.map((row) => {
      const creditCard = row.credit_card_id ? creditCardsMap.get(row.credit_card_id) : null
      return {
        date: row.date,
        amount_cents: row.amount_cents,
        credit_card_id: row.credit_card_id,
        credit_card_name: creditCard?.name ?? null,
        credit_card_color: creditCard?.color ?? null,
        credit_card_bank: creditCard?.bank ?? null,
        credit_card_flag: creditCard?.flag ?? null,
      }
    })
  }

  aggregateByCreditCard(
    expenses: ExpenseWithCreditCardRow[],
    total: number
  ): CreditCardBreakdownItem[] {
    const grouped = new Map<
      string,
      { name: string; color: string; bank: string; flag: string; amount: number }
    >()

    for (const expense of expenses) {
      const key = expense.credit_card_id ?? 'no_card'
      const current = grouped.get(key)
      if (current) {
        current.amount += expense.amount_cents
      } else {
        grouped.set(key, {
          name: expense.credit_card_name ?? 'Sem cartão',
          color: expense.credit_card_color ?? '#94a3b8',
          bank: expense.credit_card_bank ?? '',
          flag: expense.credit_card_flag ?? '',
          amount: expense.amount_cents,
        })
      }
    }

    return Array.from(grouped.entries())
      .map(([credit_card_id, data]) => ({
        credit_card_id: credit_card_id === 'no_card' ? null : credit_card_id,
        name: data.name,
        color: data.color,
        bank: data.bank,
        flag: data.flag,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
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
