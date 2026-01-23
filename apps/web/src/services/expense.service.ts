import { api } from '@/lib/api-client'
import type { CreateExpense, Expense, ExpenseFilters, UpdateExpense } from '@plim/shared'

function buildQueryString(filters?: ExpenseFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()
  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)
  if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.payment_method) params.set('payment_method', filters.payment_method)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const expenseService = {
  async listExpenses(filters?: ExpenseFilters) {
    return api.get<Expense[]>(`/expenses${buildQueryString(filters)}`)
  },

  async getExpense(id: string) {
    return api.get<Expense>(`/expenses/${id}`)
  },

  async createExpense(data: CreateExpense) {
    return api.post<Expense>('/expenses', data)
  },

  async updateExpense(id: string, data: UpdateExpense) {
    return api.patch<Expense>(`/expenses/${id}`, data)
  },

  async deleteExpense(id: string) {
    return api.delete<void>(`/expenses/${id}`)
  },

  async cancelRecurrence(id: string, endDate: string) {
    return api.patch<Expense>(`/expenses/${id}`, { recurrence_end: endDate })
  },

  async getInstallmentGroup(groupId: string) {
    return api.get<Expense[]>(`/expenses/installments/${groupId}`)
  },

  async deleteInstallmentGroup(groupId: string) {
    return api.delete<void>(`/expenses/installments/${groupId}`)
  },
}
