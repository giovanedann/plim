import { getPostHog } from '@/lib/posthog'
import { useConsentStore } from '@/stores/consent.store'
import { useEffect, useState } from 'react'

export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const analyticsConsent = useConsentStore((state) => state.analyticsConsent)

  const [enabled, setEnabled] = useState<boolean>(() => {
    const ph = getPostHog()
    if (!ph) return defaultValue
    const value = ph.isFeatureEnabled(flagKey)
    return value ?? defaultValue
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: analyticsConsent triggers re-evaluation when PostHog inits/deinits
  useEffect(() => {
    const ph = getPostHog()
    if (!ph) {
      setEnabled(defaultValue)
      return
    }

    const handleFlags = (): void => {
      const value = ph.isFeatureEnabled(flagKey)
      setEnabled(value ?? defaultValue)
    }

    handleFlags()
    ph.onFeatureFlags(handleFlags)
  }, [flagKey, defaultValue, analyticsConsent])

  return enabled
}
