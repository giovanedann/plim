import { type ApiResponse, api } from '@/lib/api-client'
import type {
  CancelSubscriptionResponse,
  CardSubscriptionResponse,
  PixPaymentResponse,
  SubscriptionStatusResponse,
} from '@plim/shared'

export const paymentService = {
  async createPixPayment(): Promise<ApiResponse<PixPaymentResponse>> {
    return api.post<PixPaymentResponse>('/payment/pix', {})
  },

  async createCardSubscription(): Promise<ApiResponse<CardSubscriptionResponse>> {
    return api.post<CardSubscriptionResponse>('/payment/card', {})
  },

  async getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatusResponse>> {
    return api.get<SubscriptionStatusResponse>('/payment/status')
  },

  async cancelSubscription(): Promise<ApiResponse<CancelSubscriptionResponse>> {
    return api.post<CancelSubscriptionResponse>('/payment/cancel', {})
  },
}
