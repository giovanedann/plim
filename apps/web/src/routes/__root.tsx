import { ConsentBanner } from '@/components/consent-banner'
import { ErrorBoundary } from '@/components/error-boundary'
import { InstallPrompt } from '@/components/install-prompt'
import { OfflineIndicator } from '@/components/offline-indicator'
import { PostHogProvider } from '@/components/posthog-provider'
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt'
import type { User } from '@supabase/supabase-js'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
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
    <PostHogProvider>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster richColors position="top-right" />
      <ConsentBanner />
      <InstallPrompt />
      <OfflineIndicator />
      <PWAUpdatePrompt />
    </PostHogProvider>
  )
}
