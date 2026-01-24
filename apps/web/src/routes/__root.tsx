import type { User } from '@supabase/supabase-js'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Toaster } from 'sonner'

export interface RouterContext {
  auth: {
    user: User | null
    isInitialized: boolean
    isInRecoveryMode: boolean
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}
