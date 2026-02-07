import { isErrorResponse } from '@/lib/api-client'
import { paymentService } from '@/services/payment.service'
import type { SubscriptionStatusResponse } from '@plim/shared'
import { useQuery } from '@tanstack/react-query'

interface UseSubscriptionReturn {
  subscription: SubscriptionStatusResponse | null
  isPro: boolean
  isExpiringSoon: boolean
  daysRemaining: number | null
  isLoading: boolean
}

export function useSubscription(): UseSubscriptionReturn {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await paymentService.getSubscriptionStatus()
      if (isErrorResponse(response)) return null
      return response.data
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    subscription: data ?? null,
    isPro: data?.tier === 'pro',
    isExpiringSoon: data?.is_expiring_soon ?? false,
    daysRemaining: data?.days_remaining ?? null,
    isLoading,
  }
}
