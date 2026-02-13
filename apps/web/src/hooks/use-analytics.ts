import { analytics } from '@/lib/analytics'

export function useAnalytics(): typeof analytics {
  return analytics
}
