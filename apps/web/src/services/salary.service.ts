import { api } from '@/lib/api-client'
import type { SalaryEntry } from '@/lib/api-types'

export interface CreateSalaryInput {
  amount: number
  effective_date: string
}

export const salaryService = {
  async getSalary(month: string) {
    return api.get<SalaryEntry>(`/salary?month=${month}`)
  },

  async getSalaryHistory() {
    return api.get<SalaryEntry[]>('/salary/history')
  },

  async createSalary(data: CreateSalaryInput) {
    return api.post<SalaryEntry>('/salary', data)
  },

  async createCurrentMonthSalary(amountInCents: number) {
    const now = new Date()
    const effectiveDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    return api.post<SalaryEntry>('/salary', {
      amount: amountInCents,
      effective_date: effectiveDate,
    })
  },
}
