import { type ApiPaginatedResponseOrError, type ApiResponse, api } from '@/lib/api-client'
import type {
  CreateExpense,
  Expense,
  ExpenseFilters,
  PaginatedExpenseFilters,
  UpdateExpense,
} from '@plim/shared'

function buildQueryString(filters?: ExpenseFilters | PaginatedExpenseFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()
  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)
  if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.payment_method) params.set('payment_method', filters.payment_method)
  if (filters.expense_type) params.set('expense_type', filters.expense_type)
  if (filters.credit_card_id) params.set('credit_card_id', filters.credit_card_id)
  if ('page' in filters && filters.page) params.set('page', String(filters.page))
  if ('limit' in filters && filters.limit) params.set('limit', String(filters.limit))

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const expenseService = {
  async listExpenses(filters?: ExpenseFilters): Promise<ApiResponse<Expense[]>> {
    return api.get<Expense[]>(`/expenses${buildQueryString(filters)}`)
  },

  async listExpensesPaginated(
    filters: PaginatedExpenseFilters
  ): Promise<ApiPaginatedResponseOrError<Expense>> {
    return api.getPaginated<Expense>(`/expenses/paginated${buildQueryString(filters)}`)
  },

  async getExpense(id: string): Promise<ApiResponse<Expense>> {
    return api.get<Expense>(`/expenses/${id}`)
  },

  async createExpense(data: CreateExpense): Promise<ApiResponse<Expense>> {
    return api.post<Expense>('/expenses', data)
  },

  async updateExpense(id: string, data: UpdateExpense): Promise<ApiResponse<Expense>> {
    return api.patch<Expense>(`/expenses/${id}`, data)
  },

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/expenses/${id}`)
  },

  async cancelRecurrence(id: string, endDate: string): Promise<ApiResponse<Expense>> {
    return api.patch<Expense>(`/expenses/${id}`, { recurrence_end: endDate })
  },

  async getInstallmentGroup(groupId: string): Promise<ApiResponse<Expense[]>> {
    return api.get<Expense[]>(`/expenses/installments/${groupId}`)
  },

  async deleteInstallmentGroup(groupId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/expenses/installments/${groupId}`)
  },

  async getRecurrentGroup(groupId: string): Promise<ApiResponse<Expense[]>> {
    return api.get<Expense[]>(`/expenses/recurrent/${groupId}`)
  },

  async deleteRecurrentGroup(groupId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/expenses/recurrent/${groupId}`)
  },
}
