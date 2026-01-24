import { api } from '@/lib/api-client'
import type { CreateCreditCard, CreditCard, UpdateCreditCard } from '@plim/shared'

export const creditCardService = {
  async listCreditCards() {
    return api.get<CreditCard[]>('/credit-cards')
  },

  async createCreditCard(data: CreateCreditCard) {
    return api.post<CreditCard>('/credit-cards', data)
  },

  async updateCreditCard(id: string, data: UpdateCreditCard) {
    return api.patch<CreditCard>(`/credit-cards/${id}`, data)
  },

  async deleteCreditCard(id: string) {
    return api.delete(`/credit-cards/${id}`)
  },
}
