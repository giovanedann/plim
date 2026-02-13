import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AnalyticsConsent = 'pending' | 'granted' | 'denied'

interface ConsentState {
  analyticsConsent: AnalyticsConsent
  hasResponded: boolean

  setConsent: (value: 'granted' | 'denied') => void
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      analyticsConsent: 'pending',
      hasResponded: false,

      setConsent: (value) => {
        set({ analyticsConsent: value, hasResponded: true })
      },
    }),
    {
      name: 'plim-analytics-consent',
      partialize: (state) => ({
        analyticsConsent: state.analyticsConsent,
        hasResponded: state.hasResponded,
      }),
    }
  )
)
