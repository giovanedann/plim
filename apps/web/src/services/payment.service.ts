import { type ApiResponse, api } from '@/lib/api-client'
import type { PixPaymentResponse, SubscriptionStatusResponse } from '@plim/shared'

export const paymentService = {
  async createPixPayment(): Promise<ApiResponse<PixPaymentResponse>> {
    return api.post<PixPaymentResponse>('/payment/pix', {})
  },

  async getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    return api.get<SubscriptionStatusResponse>('/payment/status')
  },
}
