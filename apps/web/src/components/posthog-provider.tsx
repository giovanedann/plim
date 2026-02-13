import { usePostHogIdentity } from '@/hooks/use-posthog-identity'
import { getPostHog, initPostHog } from '@/lib/posthog'
import { useConsentStore } from '@/stores/consent.store'
import { useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const analyticsConsent = useConsentStore((state) => state.analyticsConsent)
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    if (analyticsConsent === 'granted') {
      initPostHog()
      getPostHog()?.opt_in_capturing()
    } else {
      getPostHog()?.opt_out_capturing()
    }
  }, [analyticsConsent])

  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname
      if (!location.pathname.startsWith('/auth/callback')) {
        getPostHog()?.capture('$pageview')
      }
    }
  }, [location.pathname])

  usePostHogIdentity()

  return <>{children}</>
}
