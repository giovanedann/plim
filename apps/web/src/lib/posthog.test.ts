import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockInit = vi.fn()
const mockPosthog = {
  init: mockInit,
}

vi.mock('posthog-js', () => ({
  default: mockPosthog,
}))

describe('posthog', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('initPostHog', () => {
    it('calls posthog.init with correct config when env vars are set', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'test-key')
      vi.stubEnv('VITE_POSTHOG_HOST', 'https://test.posthog.com')

      const { initPostHog } = await import('./posthog')
      initPostHog()

      expect(mockInit).toHaveBeenCalledWith('test-key', {
        api_host: 'https://test.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,
        opt_out_capturing_by_default: true,
        disable_surveys: false,
        persistence: 'localStorage',
      })
    })

    it('does not call posthog.init when key is missing', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', '')
      vi.stubEnv('VITE_POSTHOG_HOST', 'https://test.posthog.com')

      const { initPostHog } = await import('./posthog')
      initPostHog()

      expect(mockInit).not.toHaveBeenCalled()
    })

    it('does not call posthog.init when host is missing', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'test-key')
      vi.stubEnv('VITE_POSTHOG_HOST', '')

      const { initPostHog } = await import('./posthog')
      initPostHog()

      expect(mockInit).not.toHaveBeenCalled()
    })

    it('only initializes once on multiple calls', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'test-key')
      vi.stubEnv('VITE_POSTHOG_HOST', 'https://test.posthog.com')

      const { initPostHog } = await import('./posthog')
      initPostHog()
      initPostHog()

      expect(mockInit).toHaveBeenCalledTimes(1)
    })
  })

  describe('getPostHog', () => {
    it('returns null before initialization', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', '')
      vi.stubEnv('VITE_POSTHOG_HOST', '')

      const { getPostHog } = await import('./posthog')

      expect(getPostHog()).toBeNull()
    })

    it('returns posthog instance after initialization', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'test-key')
      vi.stubEnv('VITE_POSTHOG_HOST', 'https://test.posthog.com')

      const { initPostHog, getPostHog } = await import('./posthog')
      initPostHog()

      expect(getPostHog()).toBe(mockPosthog)
    })
  })
})
