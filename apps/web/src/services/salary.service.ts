import { api } from '@/lib/api-client'
import type { CreateSalary, SalaryHistory } from '@plim/shared'

export const salaryService = {
  async getSalary(month: string) {
    return api.get<SalaryHistory>(`/salary?month=${month}`)
  },

  async getSalaryHistory() {
    return api.get<SalaryHistory[]>('/salary/history')
  },

  async createSalary(data: CreateSalary) {
    return api.post<SalaryHistory>('/salary', data)
  },

  async createCurrentMonthSalary(amountInCents: number) {
    const now = new Date()
    const effectiveFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    return api.post<SalaryHistory>('/salary', {
      amount_cents: amountInCents,
      effective_from: effectiveFrom,
    })
  },
}
