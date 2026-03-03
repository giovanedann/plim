import type {
  CategoryBreakdownItem,
  CategoryBreakdownResponse,
  CreditCardBreakdownItem,
  CreditCardBreakdownResponse,
  DashboardData,
  DashboardQuery,
  DashboardSummary,
  Expense,
  ExpenseFilters,
  ExpensesTimelineResponse,
  IncomeExpensesDataPoint,
  IncomeVsExpensesResponse,
  InstallmentForecastMonth,
  InstallmentForecastResponse,
  PaymentBreakdownItem,
  PaymentBreakdownResponse,
  SavingsRateDataPoint,
  SavingsRateResponse,
  TimelineGroupBy,
} from '@plim/shared'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-config'

export interface ExpenseChange {
  amount_cents: number
  category_id: string | null
  category_name?: string
  category_color?: string | null
  category_icon?: string | null
  payment_method: string
  credit_card_id?: string | null
  credit_card_name?: string
  credit_card_color?: string
  credit_card_bank?: string
  credit_card_flag?: string
  date: string
  installment_total?: number
  operation: 'add' | 'remove'
}

function recalculatePercentages<T extends { amount: number; percentage: number }>(
  items: T[],
  total: number
): void {
  for (const item of items) {
    item.percentage = total > 0 ? Math.round((item.amount / total) * 1000) / 10 : 0
  }
}

function updateSummary(summary: DashboardSummary, change: ExpenseChange): DashboardSummary {
  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents

  const newTotalExpenses = Math.max(0, summary.total_expenses + delta)
  const newBalance = summary.total_income - newTotalExpenses
  const newSavingsRate =
    summary.total_income > 0 ? Math.round((newBalance / summary.total_income) * 1000) / 10 : 0

  return {
    ...summary,
    total_expenses: newTotalExpenses,
    balance: newBalance,
    savings_rate: newSavingsRate,
  }
}

function updateCategoryBreakdown(
  breakdown: CategoryBreakdownResponse,
  change: ExpenseChange
): CategoryBreakdownResponse {
  if (!change.category_id) {
    return breakdown
  }

  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents
  const data = [...breakdown.data]
  let newTotal = breakdown.total + delta

  const categoryId = change.category_id
  const existingIndex = data.findIndex((item) => item.category_id === categoryId)
  const existingItem = data[existingIndex]

  if (existingItem) {
    const newAmount = Math.max(0, existingItem.amount + delta)
    if (newAmount === 0 && change.operation === 'remove') {
      data.splice(existingIndex, 1)
    } else {
      data[existingIndex] = { ...existingItem, amount: newAmount }
    }
  } else if (change.operation === 'add') {
    const newItem: CategoryBreakdownItem = {
      category_id: categoryId,
      name: change.category_name ?? 'Categoria',
      color: change.category_color ?? null,
      icon: change.category_icon ?? null,
      amount: change.amount_cents,
      percentage: 0,
    }
    data.push(newItem)
  }

  newTotal = Math.max(0, newTotal)
  recalculatePercentages(data, newTotal)

  return { data, total: newTotal }
}

function updatePaymentBreakdown(
  breakdown: PaymentBreakdownResponse,
  change: ExpenseChange
): PaymentBreakdownResponse {
  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents
  const data = [...breakdown.data]
  let newTotal = breakdown.total + delta

  const existingIndex = data.findIndex((item) => item.method === change.payment_method)
  const existingItem = data[existingIndex]

  if (existingItem) {
    const newAmount = Math.max(0, existingItem.amount + delta)
    if (newAmount === 0 && change.operation === 'remove') {
      data.splice(existingIndex, 1)
    } else {
      data[existingIndex] = { ...existingItem, amount: newAmount }
    }
  } else if (change.operation === 'add') {
    const newItem: PaymentBreakdownItem = {
      method: change.payment_method,
      amount: change.amount_cents,
      percentage: 0,
    }
    data.push(newItem)
  }

  newTotal = Math.max(0, newTotal)
  recalculatePercentages(data, newTotal)

  return { data, total: newTotal }
}

function updateCreditCardBreakdown(
  breakdown: CreditCardBreakdownResponse,
  change: ExpenseChange
): CreditCardBreakdownResponse {
  if (change.payment_method !== 'credit_card' || !change.credit_card_id) {
    return breakdown
  }

  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents
  const data = [...breakdown.data]
  let newTotal = breakdown.total + delta

  const existingIndex = data.findIndex((item) => item.credit_card_id === change.credit_card_id)
  const existingItem = data[existingIndex]

  if (existingItem) {
    const newAmount = Math.max(0, existingItem.amount + delta)
    if (newAmount === 0 && change.operation === 'remove') {
      data.splice(existingIndex, 1)
    } else {
      data[existingIndex] = { ...existingItem, amount: newAmount }
    }
  } else if (change.operation === 'add') {
    const newItem: CreditCardBreakdownItem = {
      credit_card_id: change.credit_card_id,
      name: change.credit_card_name ?? 'Cartão',
      color: change.credit_card_color ?? '#888888',
      bank: change.credit_card_bank ?? '',
      flag: change.credit_card_flag ?? '',
      amount: change.amount_cents,
      percentage: 0,
    }
    data.push(newItem)
  }

  newTotal = Math.max(0, newTotal)
  recalculatePercentages(data, newTotal)

  return { data, total: newTotal }
}

function getDateBucket(date: string, groupBy: TimelineGroupBy): string {
  const d = new Date(`${date}T00:00:00`)

  switch (groupBy) {
    case 'day':
      return date
    case 'week': {
      const dayOfWeek = d.getDay()
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const monday = new Date(d.setDate(diff))
      return monday.toISOString().slice(0, 10)
    }
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }
}

function updateExpensesTimeline(
  timeline: ExpensesTimelineResponse,
  change: ExpenseChange,
  groupBy: TimelineGroupBy
): ExpensesTimelineResponse {
  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents
  const bucket = getDateBucket(change.date, groupBy)
  const data = [...timeline.data]

  const existingIndex = data.findIndex((item) => item.date === bucket)
  const existingItem = data[existingIndex]

  if (existingItem) {
    const newAmount = Math.max(0, existingItem.amount + delta)
    data[existingIndex] = { ...existingItem, amount: newAmount }
  } else if (change.operation === 'add') {
    data.push({ date: bucket, amount: change.amount_cents })
    data.sort((a, b) => a.date.localeCompare(b.date))
  }

  return { data, group_by: timeline.group_by }
}

function updateIncomeVsExpenses(
  response: IncomeVsExpensesResponse,
  change: ExpenseChange
): IncomeVsExpensesResponse {
  const delta = change.operation === 'add' ? change.amount_cents : -change.amount_cents
  const month = change.date.slice(0, 7)
  const items = [...response.data]

  const existingIndex = items.findIndex((item) => item.month === month)
  const existingItem = items[existingIndex]

  if (existingItem) {
    const newExpenses = Math.max(0, existingItem.expenses + delta)
    items[existingIndex] = { ...existingItem, expenses: newExpenses }
  } else if (change.operation === 'add') {
    const newItem: IncomeExpensesDataPoint = {
      month,
      income: 0,
      expenses: change.amount_cents,
    }
    items.push(newItem)
    items.sort((a, b) => a.month.localeCompare(b.month))
  }

  return { data: items }
}

function updateSavingsRate(
  response: SavingsRateResponse,
  change: ExpenseChange,
  incomeVsExpenses: IncomeVsExpensesResponse
): SavingsRateResponse {
  const month = change.date.slice(0, 7)
  const items = [...response.data]
  const incomeData = incomeVsExpenses.data.find((d) => d.month === month)

  if (!incomeData || incomeData.income === 0) {
    return response
  }

  const existingIndex = items.findIndex((item) => item.month === month)
  const existingItem = items[existingIndex]
  const newRate =
    Math.round(((incomeData.income - incomeData.expenses) / incomeData.income) * 1000) / 10

  if (existingItem) {
    items[existingIndex] = { ...existingItem, rate: newRate }
  } else {
    const newItem: SavingsRateDataPoint = { month, rate: newRate }
    items.push(newItem)
    items.sort((a, b) => a.month.localeCompare(b.month))
  }

  return { data: items }
}

function updateInstallmentForecast(
  response: InstallmentForecastResponse,
  change: ExpenseChange
): InstallmentForecastResponse {
  if (!change.installment_total || change.installment_total <= 1) {
    return response
  }

  const perInstallment = Math.ceil(change.amount_cents / change.installment_total)
  const startDate = new Date(`${change.date}T00:00:00`)
  const items = [...response.data]

  for (let i = 0; i < change.installment_total; i++) {
    const forecastDate = new Date(startDate)
    forecastDate.setMonth(forecastDate.getMonth() + i)
    const month = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`

    const existingIndex = items.findIndex((item) => item.month === month)
    const existingItem = items[existingIndex]
    const delta = change.operation === 'add' ? perInstallment : -perInstallment

    if (existingItem) {
      const newTotal = Math.max(0, existingItem.total + delta)
      items[existingIndex] = { ...existingItem, total: newTotal }
    } else if (change.operation === 'add') {
      const newItem: InstallmentForecastMonth = { month, total: perInstallment }
      items.push(newItem)
    }
  }

  items.sort((a, b) => a.month.localeCompare(b.month))
  return { data: items.filter((item) => item.total > 0) }
}

export function updateDashboardOptimistically(
  oldData: DashboardData | undefined,
  change: ExpenseChange,
  groupBy: TimelineGroupBy
): DashboardData | undefined {
  if (!oldData) return undefined

  const updatedIncomeVsExpenses = oldData.incomeVsExpenses
    ? updateIncomeVsExpenses(oldData.incomeVsExpenses, change)
    : null

  return {
    summary: updateSummary(oldData.summary, change),
    categoryBreakdown: updateCategoryBreakdown(oldData.categoryBreakdown, change),
    paymentBreakdown: updatePaymentBreakdown(oldData.paymentBreakdown, change),
    creditCardBreakdown: oldData.creditCardBreakdown
      ? updateCreditCardBreakdown(oldData.creditCardBreakdown, change)
      : null,
    expensesTimeline: updateExpensesTimeline(oldData.expensesTimeline, change, groupBy),
    incomeVsExpenses: updatedIncomeVsExpenses,
    savingsRate:
      oldData.savingsRate && updatedIncomeVsExpenses
        ? updateSavingsRate(oldData.savingsRate, change, updatedIncomeVsExpenses)
        : null,
    salaryTimeline: oldData.salaryTimeline,
    installmentForecast: oldData.installmentForecast
      ? updateInstallmentForecast(oldData.installmentForecast, change)
      : null,
    creditCardUtilization: oldData.creditCardUtilization,
    recurringVsOnetime: oldData.recurringVsOnetime,
    dayOfWeek: oldData.dayOfWeek,
    invoiceCalendar: oldData.invoiceCalendar,
    spendingLimitProgress: oldData.spendingLimitProgress,
    expenseForecast: oldData.expenseForecast,
  }
}

export function applyOptimisticDashboardUpdate(
  queryClient: QueryClient,
  change: ExpenseChange
): Map<readonly unknown[], DashboardData | undefined> {
  const previousDashboards = new Map<readonly unknown[], DashboardData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const dashboardQueries = queryCache.findAll({
    queryKey: queryKeys.dashboard.all,
  })

  for (const query of dashboardQueries) {
    const queryKey = query.queryKey as readonly [string, DashboardQuery]
    const params = queryKey[1]
    const groupBy = params?.group_by

    if (!groupBy) continue

    const previousData = queryClient.getQueryData<DashboardData>(queryKey)
    previousDashboards.set(queryKey, previousData)

    queryClient.setQueryData<DashboardData>(queryKey, (old) =>
      updateDashboardOptimistically(old, change, groupBy)
    )
  }

  return previousDashboards
}

export function rollbackDashboardUpdate(
  queryClient: QueryClient,
  previousDashboards: Map<readonly unknown[], DashboardData | undefined>
): void {
  for (const [key, data] of previousDashboards) {
    queryClient.setQueryData(key, data)
  }
}

// ============================================================================
// Expenses List Optimistic Updates
// ============================================================================

// Query cache can contain either wrapped response { data: Expense[] } or raw Expense[]
type ExpensesCacheData = { data: Expense[] } | Expense[]

function getExpensesArray(cacheData: ExpensesCacheData): Expense[] {
  return Array.isArray(cacheData) ? cacheData : cacheData.data
}

function wrapExpensesArray(expenses: Expense[], original: ExpensesCacheData): ExpensesCacheData {
  // Preserve the original shape including extra properties (e.g. meta for paginated queries)
  return Array.isArray(original) ? expenses : { ...original, data: expenses }
}

function expenseMatchesFilters(expense: Expense, filters: ExpenseFilters): boolean {
  if (filters.start_date && expense.date < filters.start_date) return false
  if (filters.end_date && expense.date > filters.end_date) return false
  if (filters.category_id && expense.category_id !== filters.category_id) return false
  if (filters.payment_method && expense.payment_method !== filters.payment_method) return false

  if (filters.expense_type) {
    const isRecurrent = expense.is_recurrent
    const isInstallment = (expense.installment_total ?? 0) > 1
    const expenseType = isRecurrent ? 'recurrent' : isInstallment ? 'installment' : 'one_time'
    if (expenseType !== filters.expense_type) return false
  }

  if (filters.credit_card_id) {
    if (filters.credit_card_id === 'none') {
      if (expense.credit_card_id) return false
    } else {
      if (expense.credit_card_id !== filters.credit_card_id) return false
    }
  }

  return true
}

export function applyOptimisticExpenseAdd(
  queryClient: QueryClient,
  expense: Expense
): Map<readonly unknown[], ExpensesCacheData | undefined> {
  const previousExpenses = new Map<readonly unknown[], ExpensesCacheData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey as readonly [string, ExpenseFilters?]
    const filters = queryKey[1] ?? {}

    if (!expenseMatchesFilters(expense, filters)) continue

    const previousData = queryClient.getQueryData<ExpensesCacheData>(queryKey)
    previousExpenses.set(queryKey, previousData)

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return [expense]
      const expenses = getExpensesArray(old)
      const newData = [...expenses, expense].sort((a, b) => b.date.localeCompare(a.date))
      return wrapExpensesArray(newData, old)
    })
  }

  return previousExpenses
}

export function applyOptimisticExpenseUpdate(
  queryClient: QueryClient,
  expenseId: string,
  updatedExpense: Expense
): Map<readonly unknown[], ExpensesCacheData | undefined> {
  const previousExpenses = new Map<readonly unknown[], ExpensesCacheData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey as readonly [string, ExpenseFilters?]
    const filters = queryKey[1] ?? {}

    const previousData = queryClient.getQueryData<ExpensesCacheData>(queryKey)
    if (!previousData) continue

    previousExpenses.set(queryKey, previousData)

    const expenses = getExpensesArray(previousData)
    const matchesNow = expenseMatchesFilters(updatedExpense, filters)
    const existedBefore = expenses.some((e) => e.id === expenseId)

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return old
      const currentExpenses = getExpensesArray(old)

      if (existedBefore && matchesNow) {
        const newData = currentExpenses.map((e) => (e.id === expenseId ? updatedExpense : e))
        return wrapExpensesArray(
          newData.sort((a, b) => b.date.localeCompare(a.date)),
          old
        )
      }

      if (existedBefore && !matchesNow) {
        return wrapExpensesArray(
          currentExpenses.filter((e) => e.id !== expenseId),
          old
        )
      }

      if (!existedBefore && matchesNow) {
        return wrapExpensesArray(
          [...currentExpenses, updatedExpense].sort((a, b) => b.date.localeCompare(a.date)),
          old
        )
      }

      return old
    })
  }

  return previousExpenses
}

export function applyOptimisticExpenseRemove(
  queryClient: QueryClient,
  expenseId: string
): Map<readonly unknown[], ExpensesCacheData | undefined> {
  const previousExpenses = new Map<readonly unknown[], ExpensesCacheData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey
    const previousData = queryClient.getQueryData<ExpensesCacheData>(queryKey)
    if (!previousData) continue

    const expenses = getExpensesArray(previousData)
    const hasExpense = expenses.some((e) => e.id === expenseId)
    if (!hasExpense) continue

    previousExpenses.set(queryKey, previousData)

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return old
      const currentExpenses = getExpensesArray(old)
      return wrapExpensesArray(
        currentExpenses.filter((e) => e.id !== expenseId),
        old
      )
    })
  }

  return previousExpenses
}

export function applyOptimisticExpenseGroupRemove(
  queryClient: QueryClient,
  groupId: string
): Map<readonly unknown[], ExpensesCacheData | undefined> {
  const previousExpenses = new Map<readonly unknown[], ExpensesCacheData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey
    const previousData = queryClient.getQueryData<ExpensesCacheData>(queryKey)
    if (!previousData) continue

    const expenses = getExpensesArray(previousData)
    const hasGroupExpenses = expenses.some((e) => e.installment_group_id === groupId)
    if (!hasGroupExpenses) continue

    previousExpenses.set(queryKey, previousData)

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return old
      const currentExpenses = getExpensesArray(old)
      return wrapExpensesArray(
        currentExpenses.filter((e) => e.installment_group_id !== groupId),
        old
      )
    })
  }

  return previousExpenses
}

export function applyOptimisticRecurrentGroupRemove(
  queryClient: QueryClient,
  groupId: string
): Map<readonly unknown[], ExpensesCacheData | undefined> {
  const previousExpenses = new Map<readonly unknown[], ExpensesCacheData | undefined>()
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey
    const previousData = queryClient.getQueryData<ExpensesCacheData>(queryKey)
    if (!previousData) continue

    const expenses = getExpensesArray(previousData)
    const hasGroupExpenses = expenses.some((e) => e.recurrent_group_id === groupId)
    if (!hasGroupExpenses) continue

    previousExpenses.set(queryKey, previousData)

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return old
      const currentExpenses = getExpensesArray(old)
      return wrapExpensesArray(
        currentExpenses.filter((e) => e.recurrent_group_id !== groupId),
        old
      )
    })
  }

  return previousExpenses
}

export function rollbackExpensesUpdate(
  queryClient: QueryClient,
  previousExpenses: Map<readonly unknown[], ExpensesCacheData | undefined>
): void {
  for (const [key, data] of previousExpenses) {
    queryClient.setQueryData(key, data)
  }
}

export function addExpensesToCache(queryClient: QueryClient, expenses: Expense | Expense[]): void {
  const expenseArray = Array.isArray(expenses) ? expenses : [expenses]
  const queryCache = queryClient.getQueryCache()

  const expensesQueries = queryCache.findAll({
    queryKey: queryKeys.expenses(),
  })

  for (const query of expensesQueries) {
    const queryKey = query.queryKey as readonly [string, ExpenseFilters?]
    const filters = queryKey[1] ?? {}

    const matchingExpenses = expenseArray.filter((exp) => expenseMatchesFilters(exp, filters))
    if (matchingExpenses.length === 0) continue

    queryClient.setQueryData<ExpensesCacheData>(queryKey, (old) => {
      if (!old) return matchingExpenses
      const currentExpenses = getExpensesArray(old)
      const existingIds = new Set(currentExpenses.map((e) => e.id))
      const newExpenses = matchingExpenses.filter((e) => !existingIds.has(e.id))
      if (newExpenses.length === 0) return old
      const combined = [...currentExpenses, ...newExpenses]
      return wrapExpensesArray(
        combined.sort((a, b) => b.date.localeCompare(a.date)),
        old
      )
    })
  }
}
