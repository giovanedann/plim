import { ThemeProvider } from '@/components/theme-provider'
import { queryClient } from '@/lib/query-client'
import { idbPersister } from '@/lib/query-persister'
import { useAuthStore } from '@/stores/auth.store'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
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
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: idbPersister,
          maxAge: 1000 * 60 * 60 * 24,
          buster: import.meta.env.VITE_APP_VERSION || '',
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              if (query.state.status !== 'success') return false
              const firstKey = query.queryKey[0]
              if (typeof firstKey === 'string' && firstKey.startsWith('ai')) return false
              return true
            },
          },
        }}
      >
        <RouterProvider
          router={router}
          context={{ auth: { user, isInitialized, isInRecoveryMode } }}
        />
      </PersistQueryClientProvider>
    </ThemeProvider>
  )
}
