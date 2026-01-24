import { queryConfig, queryKeys } from '@/lib/query-config'
import { profileService } from '@/services/profile.service'
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const result = await profileService.getProfile()
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.profile,
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
