import { type ApiResponse, api } from '@/lib/api-client'
import type { CreateSalary, SalaryHistory } from '@plim/shared'

export const salaryService = {
  async getSalary(month: string): Promise<ApiResponse<SalaryHistory>> {
    return api.get<SalaryHistory>(`/salary?month=${month}`)
  },

  async getSalaryHistory(): Promise<ApiResponse<SalaryHistory[]>> {
    return api.get<SalaryHistory[]>('/salary/history')
  },

  async createSalary(data: CreateSalary): Promise<ApiResponse<SalaryHistory>> {
    return api.post<SalaryHistory>('/salary', data)
  },

  async createCurrentMonthSalary(amountInCents: number): Promise<ApiResponse<SalaryHistory>> {
    const now = new Date()
    const effectiveFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    return api.post<SalaryHistory>('/salary', {
      amount_cents: amountInCents,
      effective_from: effectiveFrom,
    })
  },
}
