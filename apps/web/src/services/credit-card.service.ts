import { type ApiResponse, api } from '@/lib/api-client'
import type { CreateCreditCard, CreditCard, UpdateCreditCard } from '@plim/shared'

export const creditCardService = {
  async listCreditCards(): Promise<ApiResponse<CreditCard[]>> {
    return api.get<CreditCard[]>('/credit-cards')
  },

  async createCreditCard(data: CreateCreditCard): Promise<ApiResponse<CreditCard>> {
    return api.post<CreditCard>('/credit-cards', data)
  },

  async updateCreditCard(id: string, data: UpdateCreditCard): Promise<ApiResponse<CreditCard>> {
    return api.patch<CreditCard>(`/credit-cards/${id}`, data)
  },

  async deleteCreditCard(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/credit-cards/${id}`)
  },
}
