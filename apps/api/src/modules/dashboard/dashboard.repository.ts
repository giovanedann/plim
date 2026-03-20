import {
  type CategoryBreakdownItem,
  type CreditCardBreakdownItem,
  type CreditCardUtilizationItem,
  type DashboardQuery,
  type IncomeExpensesDataPoint,
  type InstallmentForecastMonth,
  type InvoiceCalendarItem,
  type PaymentBreakdownItem,
  type SalaryTimelineDataPoint,
  type SavingsRateDataPoint,
  type TimelineDataPoint,
  type TimelineGroupBy,
  getBillingCycleDates,
  getInvoiceMonth,
} from '@plim/shared'
import type { Database } from '@plim/shared/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ExpenseRow {
  date: string
  amount_cents: number
  payment_method: string
  category_id: string | null
  category_name: string
  category_color: string | null
  category_icon: string | null
  installment_group_id: string | null
  installment_total: number | null
  installment_current: number | null
  description: string
  is_recurrent: boolean
}

interface IncomeRow {
  date: string
  amount_cents: number
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
  constructor(private supabase: SupabaseClient<Database>) {}

  async getExpensesForPeriod(userId: string, query: DashboardQuery): Promise<ExpenseRow[]> {
    const { data: expenses, error } = await this.supabase
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
        description,
        is_recurrent
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', query.start_date)
      .lte('date', query.end_date)
      .order('date', { ascending: true })

    if (error || !expenses) return []

    return expenses.map((row) => {
      const category = row.category as unknown as {
        name: string
        color: string | null
        icon: string | null
      } | null
      return {
        date: row.date!,
        amount_cents: row.amount_cents!,
        payment_method: row.payment_method!,
        category_id: row.category_id,
        category_name: category?.name ?? 'Sem categoria',
        category_color: category?.color ?? null,
        category_icon: category?.icon ?? null,
        installment_group_id: row.installment_group_id,
        installment_total: row.installment_total,
        installment_current: row.installment_current,
        description: row.description,
        is_recurrent: row.is_recurrent ?? false,
      }
    })
  }

  async getIncomesForPeriod(userId: string, query: DashboardQuery): Promise<IncomeRow[]> {
    const { data: incomes, error } = await this.supabase
      .from('expense')
      .select('date, amount_cents, description')
      .eq('user_id', userId)
      .eq('type', 'income')
      .gte('date', query.start_date)
      .lte('date', query.end_date)
      .order('date', { ascending: true })

    if (error || !incomes) return []

    return incomes as IncomeRow[]
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
    const endDate = new Date(currentDate)
    endDate.setMonth(endDate.getMonth() + months)

    const { data: expenses, error } = await this.supabase
      .from('expense')
      .select('amount_cents, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', currentDate)
      .lte('date', endDate.toISOString().slice(0, 10))
      .order('date', { ascending: true })

    if (error || !expenses) return []

    return expenses.map((row) => ({
      amount_cents: row.amount_cents!,
      date: row.date!,
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
      string | null,
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
    const { data: expenses, error: expensesError } = await this.supabase
      .from('expense')
      .select('date, amount_cents, credit_card_id')
      .eq('user_id', userId)
      .eq('type', 'expense')
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
          creditCardsMap.set(card.id!, {
            name: card.name!,
            color: card.color!,
            bank: card.bank!,
            flag: card.flag!,
          })
        }
      }
    }

    return expenses.map((row) => {
      const creditCard = row.credit_card_id ? creditCardsMap.get(row.credit_card_id!) : null
      return {
        date: row.date!,
        amount_cents: row.amount_cents!,
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

  async getCreditCardBreakdownByCycle(userId: string): Promise<{
    expenses: ExpenseWithCreditCardRow[]
    total: number
  }> {
    const today = new Date().toISOString().split('T')[0]!

    const { data: cards, error: cardsError } = await this.supabase
      .from('credit_card')
      .select('id, name, color, bank, flag, closing_day')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (cardsError || !cards || cards.length === 0) return { expenses: [], total: 0 }

    const cardCycles = new Map<
      string,
      { cycleStart: string; cycleEnd: string; card: (typeof cards)[number] }
    >()

    let earliestStart = ''
    let latestEnd = ''

    for (const card of cards) {
      const closingDay = card.closing_day as number | null
      if (!closingDay) continue

      const referenceMonth = getInvoiceMonth(closingDay, today)
      const { cycleStart, cycleEnd } = getBillingCycleDates(closingDay, referenceMonth)
      cardCycles.set(card.id as string, { cycleStart, cycleEnd, card })

      if (!earliestStart || cycleStart < earliestStart) earliestStart = cycleStart
      if (!latestEnd || cycleEnd > latestEnd) latestEnd = cycleEnd
    }

    if (cardCycles.size === 0) return { expenses: [], total: 0 }

    const cardIds = [...cardCycles.keys()]

    const { data: rawExpenses, error: expError } = await this.supabase
      .from('expense')
      .select('date, amount_cents, credit_card_id')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .in('credit_card_id', cardIds)
      .gte('date', earliestStart)
      .lte('date', latestEnd)

    if (expError || !rawExpenses) return { expenses: [], total: 0 }

    const filteredExpenses: ExpenseWithCreditCardRow[] = []
    let total = 0

    for (const row of rawExpenses) {
      const cardId = row.credit_card_id as string
      const cycle = cardCycles.get(cardId)
      if (!cycle) continue

      const date = row.date as string
      if (date < cycle.cycleStart || date > cycle.cycleEnd) continue

      const amountCents = row.amount_cents as number
      total += amountCents

      filteredExpenses.push({
        date,
        amount_cents: amountCents,
        credit_card_id: cardId,
        credit_card_name: cycle.card.name as string,
        credit_card_color: cycle.card.color as string,
        credit_card_bank: cycle.card.bank as string,
        credit_card_flag: cycle.card.flag as string,
      })
    }

    return { expenses: filteredExpenses, total }
  }

  calculateMonthlyIncomeExpenses(
    expenses: ExpenseRow[],
    salaries: SalaryRow[],
    startDate: string,
    endDate: string,
    incomes: IncomeRow[] = []
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

    const incomesByMonth = new Map<string, number>()
    for (const income of incomes) {
      const month = income.date.slice(0, 7)
      const current = incomesByMonth.get(month) ?? 0
      incomesByMonth.set(month, current + income.amount_cents)
    }

    let currentMonth = startMonth
    while (currentMonth <= endMonth) {
      const salaryIncome = this.getSalaryForMonth(salaries, currentMonth)
      const transactionIncome = incomesByMonth.get(currentMonth) ?? 0
      const expensesTotal = expensesByMonth.get(currentMonth) ?? 0

      result.push({
        month: currentMonth,
        income: salaryIncome + transactionIncome,
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

  async getCreditCardUtilization(userId: string): Promise<CreditCardUtilizationItem[]> {
    const { data: cards, error: cardsError } = await this.supabase
      .from('credit_card')
      .select('id, name, color, bank, flag, closing_day, credit_limit_cents')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('credit_limit_cents', 'is', null)

    if (cardsError || !cards || cards.length === 0) return []

    const today = new Date().toISOString().split('T')[0]!

    const cardData = new Map<
      string,
      {
        limitCents: number
        card: (typeof cards)[number]
        currentRefMonth: string
        cycleStart: string
        cycleEnd: string
      }
    >()

    let earliestCycleStart = ''
    let latestCycleEnd = ''

    for (const card of cards) {
      const closingDay = card.closing_day as number | null
      const limitCents = card.credit_limit_cents as number
      if (!closingDay || !limitCents) continue

      const currentRefMonth = getInvoiceMonth(closingDay, today)
      const { cycleStart, cycleEnd } = getBillingCycleDates(closingDay, currentRefMonth)

      cardData.set(card.id as string, {
        limitCents,
        card,
        currentRefMonth,
        cycleStart,
        cycleEnd,
      })

      if (!earliestCycleStart || cycleStart < earliestCycleStart) earliestCycleStart = cycleStart
      if (!latestCycleEnd || cycleEnd > latestCycleEnd) latestCycleEnd = cycleEnd
    }

    if (cardData.size === 0) return []

    const cardIds = [...cardData.keys()]

    // Batch-fetch unpaid invoices for all cards (older + current)
    const { data: unpaidInvoices } = await this.supabase
      .from('invoice')
      .select('credit_card_id, reference_month, total_amount_cents, paid_amount_cents')
      .in('credit_card_id', cardIds)
      .eq('user_id', userId)
      .neq('status', 'paid')

    // Batch-fetch current cycle expenses for accurate current month totals
    const { data: cycleExpenses } = await this.supabase
      .from('expense')
      .select('amount_cents, credit_card_id, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .in('credit_card_id', cardIds)
      .gte('date', earliestCycleStart)
      .lte('date', latestCycleEnd)

    // Batch-fetch future installments (after latest cycle end)
    const { data: futureInstallments } = await this.supabase
      .from('expense')
      .select('amount_cents, credit_card_id, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .in('credit_card_id', cardIds)
      .gt('date', latestCycleEnd)
      .not('installment_group_id', 'is', null)

    const results: CreditCardUtilizationItem[] = []

    for (const [cardId, { limitCents, card, currentRefMonth, cycleStart, cycleEnd }] of cardData) {
      // Older unpaid invoices (not current month) — trust stored totals
      const olderInvoiceDebt = (unpaidInvoices ?? [])
        .filter(
          (inv) =>
            (inv.credit_card_id as string) === cardId &&
            (inv.reference_month as string) !== currentRefMonth
        )
        .reduce(
          (sum, inv) =>
            sum + (inv.total_amount_cents as number) - (inv.paid_amount_cents as number),
          0
        )

      // Current cycle expenses — compute from actual expenses
      const currentCycleTotal = (cycleExpenses ?? [])
        .filter(
          (e) =>
            (e.credit_card_id as string) === cardId &&
            (e.date as string) >= cycleStart &&
            (e.date as string) <= cycleEnd
        )
        .reduce((sum, e) => sum + (e.amount_cents as number), 0)

      // Subtract any payments already made on the current month's invoice
      const currentInvoicePaid = (unpaidInvoices ?? [])
        .filter(
          (inv) =>
            (inv.credit_card_id as string) === cardId &&
            (inv.reference_month as string) === currentRefMonth
        )
        .reduce((sum, inv) => sum + (inv.paid_amount_cents as number), 0)

      // Future installments for this card (after its cycle end)
      const futureTotal = (futureInstallments ?? [])
        .filter((e) => (e.credit_card_id as string) === cardId && (e.date as string) > cycleEnd)
        .reduce((sum, e) => sum + (e.amount_cents as number), 0)

      const usedCents = olderInvoiceDebt + (currentCycleTotal - currentInvoicePaid) + futureTotal

      results.push({
        credit_card_id: cardId,
        name: card.name as string,
        color: card.color as string,
        bank: card.bank as string,
        flag: card.flag as string,
        used_cents: usedCents,
        limit_cents: limitCents,
        utilization_percent: Math.round((usedCents / limitCents) * 1000) / 10,
      })
    }

    return results.sort((a, b) => b.utilization_percent - a.utilization_percent)
  }

  aggregateRecurringVsOnetime(expenses: ExpenseRow[]): {
    recurring_amount: number
    onetime_amount: number
  } {
    let recurringAmount = 0
    let onetimeAmount = 0

    for (const expense of expenses) {
      if (expense.is_recurrent) {
        recurringAmount += expense.amount_cents
      } else {
        onetimeAmount += expense.amount_cents
      }
    }

    return { recurring_amount: recurringAmount, onetime_amount: onetimeAmount }
  }

  aggregateByDayOfWeek(
    expenses: ExpenseRow[]
  ): { day_of_week: number; total: number; count: number }[] {
    const totals = new Map<number, number>()
    const uniqueDates = new Map<number, Set<string>>()

    for (let d = 0; d < 7; d++) {
      totals.set(d, 0)
      uniqueDates.set(d, new Set())
    }

    for (const expense of expenses) {
      const dayOfWeek = new Date(expense.date).getUTCDay()
      totals.set(dayOfWeek, (totals.get(dayOfWeek) ?? 0) + expense.amount_cents)
      uniqueDates.get(dayOfWeek)!.add(expense.date)
    }

    return Array.from(totals.entries()).map(([dayOfWeek, total]) => ({
      day_of_week: dayOfWeek,
      total,
      count: uniqueDates.get(dayOfWeek)!.size,
    }))
  }

  async getUpcomingInvoices(userId: string): Promise<InvoiceCalendarItem[]> {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const futureDate = new Date(now)
    futureDate.setMonth(futureDate.getMonth() + 3)
    const endMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`

    const { data: invoices, error } = await this.supabase
      .from('invoice')
      .select('id, credit_card_id, reference_month, paid_amount_cents, status')
      .eq('user_id', userId)
      .gte('reference_month', currentMonth)
      .lte('reference_month', endMonth)
      .order('reference_month', { ascending: true })

    if (error || !invoices || invoices.length === 0) return []

    const creditCardIds = [...new Set(invoices.map((inv) => inv.credit_card_id as string))]

    const { data: cards } = await this.supabase
      .from('credit_card')
      .select('id, name, color, bank, flag, expiration_day, closing_day')
      .in('id', creditCardIds)

    if (!cards || cards.length === 0) return []

    const cardsMap = new Map<
      string,
      {
        name: string
        color: string
        bank: string
        flag: string
        expiration_day: number | null
        closing_day: number | null
      }
    >()

    for (const card of cards) {
      cardsMap.set(card.id as string, {
        name: card.name as string,
        color: card.color as string,
        bank: card.bank as string,
        flag: card.flag as string,
        expiration_day: card.expiration_day as number | null,
        closing_day: card.closing_day as number | null,
      })
    }

    const invoiceCycles: {
      invoice: (typeof invoices)[number]
      card: NonNullable<ReturnType<typeof cardsMap.get>>
      cycleStart: string
      cycleEnd: string
    }[] = []

    let earliestStart = ''
    let latestEnd = ''

    for (const invoice of invoices) {
      const card = cardsMap.get(invoice.credit_card_id as string)
      if (!card || !card.closing_day) continue

      const { cycleStart, cycleEnd } = getBillingCycleDates(
        card.closing_day,
        invoice.reference_month as string
      )

      invoiceCycles.push({ invoice, card, cycleStart, cycleEnd })

      if (!earliestStart || cycleStart < earliestStart) earliestStart = cycleStart
      if (!latestEnd || cycleEnd > latestEnd) latestEnd = cycleEnd
    }

    if (invoiceCycles.length === 0) return []

    const { data: expenses } = await this.supabase
      .from('expense')
      .select('amount_cents, credit_card_id, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .in('credit_card_id', creditCardIds)
      .gte('date', earliestStart)
      .lte('date', latestEnd)

    const results: InvoiceCalendarItem[] = []

    for (const { invoice, card, cycleStart, cycleEnd } of invoiceCycles) {
      const cardId = invoice.credit_card_id as string

      const totalCents = (expenses ?? [])
        .filter(
          (e) =>
            (e.credit_card_id as string) === cardId &&
            (e.date as string) >= cycleStart &&
            (e.date as string) <= cycleEnd
        )
        .reduce((sum, e) => sum + (e.amount_cents as number), 0)

      const expirationDay = card.expiration_day ?? 10
      const [yearStr, monthStr] = (invoice.reference_month as string).split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)
      const daysInMonth = new Date(year, month, 0).getDate()
      const clampedDay = Math.min(expirationDay, daysInMonth)
      const dueDate = `${yearStr}-${monthStr}-${String(clampedDay).padStart(2, '0')}`

      const paidCents = (invoice.paid_amount_cents as number | null) ?? 0

      results.push({
        credit_card_id: cardId,
        credit_card_name: card.name,
        color: card.color,
        bank: card.bank,
        flag: card.flag,
        due_date: dueDate,
        total_cents: totalCents,
        paid_cents: paidCents,
        is_paid: invoice.status === 'paid',
      })
    }

    return results.sort((a, b) => a.due_date.localeCompare(b.due_date))
  }

  async getSpendingLimitProgress(userId: string): Promise<{
    spent_cents: number
    limit_cents: number
    days_remaining: number
  } | null> {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data: limits, error: limitError } = await this.supabase
      .from('spending_limit')
      .select('amount_cents')
      .eq('user_id', userId)
      .lte('year_month', currentMonth)
      .order('year_month', { ascending: false })
      .limit(1)

    if (limitError || !limits || limits.length === 0) return null

    const limitCents = limits[0]!.amount_cents as number

    const monthStart = `${currentMonth}-01`
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthEnd = `${currentMonth}-${String(daysInMonth).padStart(2, '0')}`

    const { data: expenses, error: expError } = await this.supabase
      .from('expense')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', monthStart)
      .lte('date', monthEnd)

    if (expError) return null

    const spentCents = (expenses ?? []).reduce((sum, e) => sum + (e.amount_cents as number), 0)

    const daysRemaining = daysInMonth - now.getDate()

    return { spent_cents: spentCents, limit_cents: limitCents, days_remaining: daysRemaining }
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
