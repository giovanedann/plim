import { ThemeProvider } from '@/components/theme-provider'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const isInRecoveryMode = useAuthStore((state) => state.isInRecoveryMode)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={router}
          context={{ auth: { user, isInitialized, isInRecoveryMode } }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
