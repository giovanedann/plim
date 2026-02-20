import { isErrorResponse } from '@/lib/api-client'
import { referralService } from '@/services/referral.service'
import type { ReferralStats } from '@plim/shared'
import { useQuery } from '@tanstack/react-query'

const FIVE_MINUTES = 1000 * 60 * 5

interface UseReferralStatsReturn {
  stats: ReferralStats | undefined
  isLoading: boolean
  error: Error | null
}

export function useReferralStats(): UseReferralStatsReturn {
  const { data, isPending, error } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const result = await referralService.getReferralStats()
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data
    },
    staleTime: FIVE_MINUTES,
  })

  return {
    stats: data,
    isLoading: isPending,
    error,
  }
}
