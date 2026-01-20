import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { salaryService } from '@/services'
import { categoryService } from '@/services/category.service'
import { expenseService } from '@/services/expense.service'
import type { ExpenseFilters } from '@myfinances/shared'

function parseMonth(month: string): [number, number] {
  const parts = month.split('-').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 1]
}

function getMonthBounds(month: string) {
  const [year, monthNum] = parseMonth(month)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0)

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  }
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [filters, setFilters] = useState<Omit<ExpenseFilters, 'start_date' | 'end_date'>>({})

  const monthBounds = useMemo(() => getMonthBounds(selectedMonth), [selectedMonth])

  const expenseFilters: ExpenseFilters = useMemo(
    () => ({
      ...monthBounds,
      ...filters,
    }),
    [monthBounds, filters]
  )

  // Filtered expenses for table display
  const { data: expensesResponse, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', expenseFilters],
    queryFn: () => expenseService.listExpenses(expenseFilters),
  })

  // All expenses for the month (unfiltered) for totals calculation
  const { data: allExpensesResponse, isLoading: isLoadingAllExpenses } = useQuery({
    queryKey: ['expenses', monthBounds],
    queryFn: () => expenseService.listExpenses(monthBounds),
  })

  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.listCategories(),
  })

  const { data: salaryResponse, isLoading: isLoadingSalary } = useQuery({
    queryKey: ['salary', selectedMonth],
    queryFn: () => salaryService.getSalary(selectedMonth),
  })

  const expenses = expensesResponse?.data ?? []
  const allExpenses = allExpensesResponse?.data ?? []
  const categories = categoriesResponse?.data ?? []
  const salary = salaryResponse?.data ?? null

  // Calculate totals from ALL expenses (not filtered)
  const totalExpenses = useMemo(
    () => allExpenses.reduce((sum, expense) => sum + expense.amount_cents, 0),
    [allExpenses]
  )

  const balance = useMemo(
    () => (salary?.amount_cents ?? 0) - totalExpenses,
    [salary, totalExpenses]
  )

  const isLoading =
    isLoadingExpenses || isLoadingAllExpenses || isLoadingCategories || isLoadingSalary

  return {
    selectedMonth,
    setSelectedMonth,
    filters,
    setFilters,
    expenses,
    categories,
    salary,
    isLoading,
    totalExpenses,
    balance,
  }
}
