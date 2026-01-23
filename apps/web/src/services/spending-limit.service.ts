import { api } from '@/lib/api-client'
import type { EffectiveSpendingLimit, SpendingLimit, UpsertSpendingLimit } from '@plim/shared'

export const spendingLimitService = {
  async getSpendingLimit(yearMonth: string) {
    return api.get<EffectiveSpendingLimit | null>(`/spending-limits/${yearMonth}`)
  },

  async upsertSpendingLimit(data: UpsertSpendingLimit) {
    return api.post<SpendingLimit>('/spending-limits', data)
  },
}
