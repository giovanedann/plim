import { isErrorResponse } from '@/lib/api-client'
import { aiService } from '@/services'
import { useAIStore } from '@/stores'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useAIUsage(): void {
  const { setUsage } = useAIStore()

  const { data } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const response = await aiService.getUsage()
      if (isErrorResponse(response)) {
        console.warn('Failed to fetch AI usage:', response.error.message)
        return null
      }
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  })

  useEffect(() => {
    if (data) {
      setUsage(data)
    }
  }, [data, setUsage])
}
