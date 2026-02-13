import { getPostHog } from '@/lib/posthog'
import { useAuthStore } from '@/stores/auth.store'
import { useConsentStore } from '@/stores/consent.store'
import { useEffect, useRef } from 'react'

export function usePostHogIdentity(): void {
  const user = useAuthStore((state) => state.user)
  const analyticsConsent = useConsentStore((state) => state.analyticsConsent)
  const previousUserId = useRef<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: analyticsConsent triggers re-evaluation when PostHog inits/deinits
  useEffect(() => {
    const ph = getPostHog()
    if (!ph) return

    if (user) {
      ph.identify(user.id, { email: user.email })
      previousUserId.current = user.id
    } else if (previousUserId.current) {
      ph.reset()
      previousUserId.current = null
    }
  }, [user, analyticsConsent])
}
