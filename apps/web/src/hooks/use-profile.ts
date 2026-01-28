import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { profileService } from '@/services/profile.service'
import type { Profile } from '@plim/shared'
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const result = await profileService.getProfile()
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.profile,
  })

  return {
    profile: query.data as Profile | undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}
