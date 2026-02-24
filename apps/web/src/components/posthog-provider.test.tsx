import { type AnalyticsConsent, useConsentStore } from '@/stores/consent.store'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostHogProvider } from './posthog-provider'

const mockCapture = vi.fn()
const mockOptIn = vi.fn()
const mockOptOut = vi.fn()
const mockIdentify = vi.fn()
const mockReset = vi.fn()

const mockInitPostHog = vi.fn()
const mockGetPostHog = vi.fn()

vi.mock('@/lib/posthog', () => ({
  initPostHog: (...args: unknown[]) => mockInitPostHog(...args),
  getPostHog: () => mockGetPostHog(),
}))

vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

const mockLocation = { pathname: '/dashboard' }
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => mockLocation,
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn((selector: (state: { user: null }) => unknown) => selector({ user: null })),
}))

describe('PostHogProvider', () => {
  const initialState = {
    analyticsConsent: 'pending' as AnalyticsConsent,
    hasResponded: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useConsentStore.setState(initialState)
    mockLocation.pathname = '/dashboard'
    mockGetPostHog.mockReturnValue({
      capture: mockCapture,
      opt_in_capturing: mockOptIn,
      opt_out_capturing: mockOptOut,
      identify: mockIdentify,
      reset: mockReset,
    })
  })

  it('renders children', () => {
    const { getByText } = render(
      <PostHogProvider>
        <div>Child content</div>
      </PostHogProvider>
    )

    expect(getByText('Child content')).toBeInTheDocument()
  })

  it('calls opt_out when consent is pending', () => {
    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    expect(mockOptOut).toHaveBeenCalled()
    expect(mockInitPostHog).not.toHaveBeenCalled()
  })

  it('calls initPostHog and opt_in when consent is granted', () => {
    useConsentStore.setState({ analyticsConsent: 'granted', hasResponded: true })

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    expect(mockInitPostHog).toHaveBeenCalled()
    expect(mockOptIn).toHaveBeenCalled()
  })

  it('calls opt_out when consent is denied', () => {
    useConsentStore.setState({ analyticsConsent: 'denied', hasResponded: true })

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    expect(mockOptOut).toHaveBeenCalled()
  })

  it('captures pageview on route change', () => {
    const { rerender } = render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    mockLocation.pathname = '/transactions'
    rerender(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    expect(mockCapture).toHaveBeenCalledWith('$pageview')
  })

  it('does not capture pageview on same path', () => {
    const { rerender } = render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    rerender(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>
    )

    expect(mockCapture).not.toHaveBeenCalledWith('$pageview')
  })
})
