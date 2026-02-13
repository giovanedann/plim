import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFeatureFlag } from './use-feature-flag'

const mockIsFeatureEnabled = vi.fn()
const mockOnFeatureFlags = vi.fn()
const mockGetPostHog = vi.fn()

vi.mock('@/lib/posthog', () => ({
  getPostHog: () => mockGetPostHog(),
}))

vi.mock('@/stores/consent.store', () => ({
  useConsentStore: vi.fn((selector: any) => selector({ analyticsConsent: 'granted' })),
}))

describe('useFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPostHog.mockReturnValue({
      isFeatureEnabled: mockIsFeatureEnabled,
      onFeatureFlags: mockOnFeatureFlags,
    })
  })

  it('returns default value when PostHog is not initialized', () => {
    mockGetPostHog.mockReturnValue(null)

    const { result } = renderHook(() => useFeatureFlag('test-flag', true))
    expect(result.current).toBe(true)
  })

  it('returns false as default value when not specified', () => {
    mockGetPostHog.mockReturnValue(null)

    const { result } = renderHook(() => useFeatureFlag('test-flag'))
    expect(result.current).toBe(false)
  })

  it('returns PostHog value when available', () => {
    mockIsFeatureEnabled.mockReturnValue(true)

    const { result } = renderHook(() => useFeatureFlag('test-flag', false))
    expect(result.current).toBe(true)
    expect(mockIsFeatureEnabled).toHaveBeenCalledWith('test-flag')
  })

  it('returns default when isFeatureEnabled returns undefined', () => {
    mockIsFeatureEnabled.mockReturnValue(undefined)

    const { result } = renderHook(() => useFeatureFlag('test-flag', true))
    expect(result.current).toBe(true)
  })

  it('registers onFeatureFlags callback', () => {
    mockIsFeatureEnabled.mockReturnValue(false)

    renderHook(() => useFeatureFlag('test-flag'))
    expect(mockOnFeatureFlags).toHaveBeenCalledWith(expect.any(Function))
  })

  it('updates value when onFeatureFlags fires', () => {
    mockIsFeatureEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useFeatureFlag('test-flag', false))
    expect(result.current).toBe(false)

    mockIsFeatureEnabled.mockReturnValue(true)
    const callback = mockOnFeatureFlags.mock.calls[0]?.[0] as () => void
    act(() => {
      callback()
    })

    expect(result.current).toBe(true)
  })
})
