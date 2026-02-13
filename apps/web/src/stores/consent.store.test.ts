import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AnalyticsConsent, useConsentStore } from './consent.store'

vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

describe('useConsentStore', () => {
  const initialState = {
    analyticsConsent: 'pending' as AnalyticsConsent,
    hasResponded: false,
  }

  beforeEach(() => {
    useConsentStore.setState(initialState)
  })

  describe('initial state', () => {
    it('has analyticsConsent as pending by default', () => {
      const sut = useConsentStore.getState()

      expect(sut.analyticsConsent).toBe('pending')
    })

    it('has hasResponded as false by default', () => {
      const sut = useConsentStore.getState()

      expect(sut.hasResponded).toBe(false)
    })
  })

  describe('setConsent', () => {
    it('sets consent to granted', () => {
      const sut = useConsentStore.getState()

      sut.setConsent('granted')

      const state = useConsentStore.getState()
      expect(state.analyticsConsent).toBe('granted')
      expect(state.hasResponded).toBe(true)
    })

    it('sets consent to denied', () => {
      const sut = useConsentStore.getState()

      sut.setConsent('denied')

      const state = useConsentStore.getState()
      expect(state.analyticsConsent).toBe('denied')
      expect(state.hasResponded).toBe(true)
    })

    it('can change from granted to denied', () => {
      useConsentStore.setState({ analyticsConsent: 'granted', hasResponded: true })
      const sut = useConsentStore.getState()

      sut.setConsent('denied')

      expect(useConsentStore.getState().analyticsConsent).toBe('denied')
    })

    it('can change from denied to granted', () => {
      useConsentStore.setState({ analyticsConsent: 'denied', hasResponded: true })
      const sut = useConsentStore.getState()

      sut.setConsent('granted')

      expect(useConsentStore.getState().analyticsConsent).toBe('granted')
    })
  })
})
