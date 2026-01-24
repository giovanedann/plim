import { QueryClient } from '@tanstack/react-query'
import { queryConfig } from './query-config'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: queryConfig.staleTime.expenses,
      gcTime: queryConfig.gcTime.default,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
})
