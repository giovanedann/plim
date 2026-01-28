import { type ApiResponse, api } from '@/lib/api-client'
import type { EffectiveSpendingLimit, SpendingLimit, UpsertSpendingLimit } from '@plim/shared'

export const spendingLimitService = {
  async getSpendingLimit(yearMonth: string): Promise<ApiResponse<EffectiveSpendingLimit | null>> {
    return api.get<EffectiveSpendingLimit | null>(`/spending-limits/${yearMonth}`)
  },

  async upsertSpendingLimit(data: UpsertSpendingLimit): Promise<ApiResponse<SpendingLimit>> {
    return api.post<SpendingLimit>('/spending-limits', data)
  },
}
