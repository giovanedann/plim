import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { salaryService, spendingLimitService } from '@/services'
import { categoryService } from '@/services/category.service'
import { creditCardService } from '@/services/credit-card.service'
import { expenseService } from '@/services/expense.service'
import type {
  ApiPaginatedResponse,
  Category,
  CreditCard,
  EffectiveSpendingLimit,
  Expense,
  ExpenseFilters,
  PaginatedExpenseFilters,
  PaginationMeta,
  SalaryHistory,
} from '@plim/shared'

function parseMonth(month: string): [number, number] {
  const parts = month.split('-').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 1]
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthBounds(month: string) {
  const [year, monthNum] = parseMonth(month)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0)

  return {
    start_date: formatLocalDate(startDate),
    end_date: formatLocalDate(endDate),
  }
}

function getPreviousMonth(month: string): string {
  const [year, monthNum] = parseMonth(month)
  const prevDate = new Date(year, monthNum - 2, 1)
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [filters, setFilters] = useState<Omit<ExpenseFilters, 'start_date' | 'end_date'>>({})
  const [page, setPage] = useState(1)
  const limit = 20

  const monthBounds = useMemo(() => getMonthBounds(selectedMonth), [selectedMonth])
  const previousMonth = useMemo(() => getPreviousMonth(selectedMonth), [selectedMonth])
  const previousMonthBounds = useMemo(() => getMonthBounds(previousMonth), [previousMonth])

  const paginatedFilters: PaginatedExpenseFilters = useMemo(
    () => ({
      ...monthBounds,
      ...filters,
      page,
      limit,
    }),
    [monthBounds, filters, page]
  )

  const { data: expensesResponse, isLoading: isLoadingExpenses } = useQuery({
    queryKey: [...queryKeys.expenses(paginatedFilters), 'paginated'],
    queryFn: async (): Promise<ApiPaginatedResponse<Expense>> => {
      const result = await expenseService.listExpensesPaginated(paginatedFilters)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result
    },
    staleTime: queryConfig.staleTime.expenses,
  })

  const { data: allExpensesResponse, isLoading: isLoadingAllExpenses } = useQuery({
    queryKey: queryKeys.expenses(monthBounds),
    queryFn: async (): Promise<Expense[]> => {
      const result = await expenseService.listExpenses(monthBounds)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as Expense[]
    },
    staleTime: queryConfig.staleTime.expenses,
  })

  const { data: previousExpensesResponse } = useQuery({
    queryKey: queryKeys.expenses(previousMonthBounds),
    queryFn: async (): Promise<Expense[]> => {
      const result = await expenseService.listExpenses(previousMonthBounds)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as Expense[]
    },
    staleTime: queryConfig.staleTime.expenses,
  })

  const { data: previousSalaryResponse } = useQuery({
    queryKey: queryKeys.salary(previousMonth),
    queryFn: async (): Promise<SalaryHistory> => {
      const result = await salaryService.getSalary(previousMonth)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as SalaryHistory
    },
    staleTime: queryConfig.staleTime.salary,
  })

  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async (): Promise<Category[]> => {
      const result = await categoryService.listCategories()
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as Category[]
    },
    staleTime: queryConfig.staleTime.categories,
  })

  const { data: creditCardsResponse, isLoading: isLoadingCreditCards } = useQuery({
    queryKey: queryKeys.creditCards,
    queryFn: async (): Promise<CreditCard[]> => {
      const response = await creditCardService.listCreditCards()
      if (isErrorResponse(response)) throw new Error(response.error.message)
      return response.data as CreditCard[]
    },
    staleTime: queryConfig.staleTime.creditCards,
  })

  const { data: salaryResponse, isLoading: isLoadingSalary } = useQuery({
    queryKey: queryKeys.salary(selectedMonth),
    queryFn: async (): Promise<SalaryHistory> => {
      const result = await salaryService.getSalary(selectedMonth)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as SalaryHistory
    },
    staleTime: queryConfig.staleTime.salary,
  })

  const { data: spendingLimitResponse, isLoading: isLoadingSpendingLimit } = useQuery({
    queryKey: queryKeys.spendingLimit(selectedMonth),
    queryFn: async (): Promise<EffectiveSpendingLimit | null> => {
      const result = await spendingLimitService.getSpendingLimit(selectedMonth)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data as EffectiveSpendingLimit | null
    },
    staleTime: queryConfig.staleTime.spendingLimit,
  })

  const expenses = expensesResponse?.data ?? []
  const paginationMeta: PaginationMeta | null = expensesResponse?.meta ?? null
  const allExpenses = allExpensesResponse ?? []
  const previousExpenses = previousExpensesResponse ?? []
  const categories = categoriesResponse ?? []
  const creditCards = creditCardsResponse ?? []
  const salary = salaryResponse ?? null
  const previousSalary = previousSalaryResponse ?? null
  const spendingLimit = spendingLimitResponse ?? null

  const totalExpenses = useMemo(
    () => allExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0),
    [allExpenses]
  )

  const balance = useMemo(
    () => (salary?.amount_cents ?? 0) - totalExpenses,
    [salary, totalExpenses]
  )

  const previousTotalExpenses = useMemo(
    () => previousExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0),
    [previousExpenses]
  )

  const previousBalance = useMemo(
    () => (previousSalary?.amount_cents ?? 0) - previousTotalExpenses,
    [previousSalary, previousTotalExpenses]
  )

  const comparison = useMemo(() => {
    const hasPreviousData = previousExpenses.length > 0 || previousSalary !== null
    if (!hasPreviousData) {
      return {
        previousExpenses: null,
        previousBalance: null,
      }
    }
    return {
      previousExpenses: previousTotalExpenses,
      previousBalance: previousBalance,
    }
  }, [previousExpenses.length, previousSalary, previousTotalExpenses, previousBalance])

  const isLoading =
    isLoadingExpenses ||
    isLoadingAllExpenses ||
    isLoadingCategories ||
    isLoadingCreditCards ||
    isLoadingSalary ||
    isLoadingSpendingLimit

  // Reset page when filters or month change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional - reset page when filters or month change
  useEffect(() => {
    setPage(1)
  }, [filters, selectedMonth])

  return {
    selectedMonth,
    setSelectedMonth,
    filters,
    setFilters,
    expenses,
    allExpenses,
    categories,
    creditCards,
    salary,
    spendingLimit,
    isLoading,
    totalExpenses,
    balance,
    comparison,
    page,
    setPage,
    paginationMeta,
  }
}
