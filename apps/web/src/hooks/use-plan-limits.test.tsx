import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlanLimits } from './use-plan-limits'

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: vi.fn(),
}))

import { useSubscription } from '@/hooks/use-subscription'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePlanLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns free tier limits when user is not pro', () => {
    vi.mocked(useSubscription).mockReturnValue({
      subscription: null,
      isPro: false,
      isExpiringSoon: false,
      daysRemaining: null,
      isLoading: false,
    })

    const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

    expect(result.current.isPro).toBe(false)
    expect(result.current.limits.categories.custom).toBe(5)
    expect(result.current.limits.creditCards).toBe(2)
    expect(result.current.limits.dashboard.timeRangeDays).toBe(30)
  })

  it('returns pro tier limits when user is pro', () => {
    vi.mocked(useSubscription).mockReturnValue({
      subscription: null,
      isPro: true,
      isExpiringSoon: false,
      daysRemaining: null,
      isLoading: false,
    })

    const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

    expect(result.current.isPro).toBe(true)
    expect(result.current.limits.categories.custom).toBe(Number.POSITIVE_INFINITY)
    expect(result.current.limits.creditCards).toBe(Number.POSITIVE_INFINITY)
    expect(result.current.limits.dashboard.timeRangeDays).toBe(Number.POSITIVE_INFINITY)
  })

  describe('isAtLimit', () => {
    it('returns true when current equals limit for free users', () => {
      vi.mocked(useSubscription).mockReturnValue({
        subscription: null,
        isPro: false,
        isExpiringSoon: false,
        daysRemaining: null,
        isLoading: false,
      })

      const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

      expect(result.current.isAtLimit('categories.custom', 5)).toBe(true)
    })

    it('returns false when current is under limit for free users', () => {
      vi.mocked(useSubscription).mockReturnValue({
        subscription: null,
        isPro: false,
        isExpiringSoon: false,
        daysRemaining: null,
        isLoading: false,
      })

      const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

      expect(result.current.isAtLimit('categories.custom', 3)).toBe(false)
    })

    it('always returns false for pro users regardless of current value', () => {
      vi.mocked(useSubscription).mockReturnValue({
        subscription: null,
        isPro: true,
        isExpiringSoon: false,
        daysRemaining: null,
        isLoading: false,
      })

      const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

      expect(result.current.isAtLimit('categories.custom', 999)).toBe(false)
      expect(result.current.isAtLimit('creditCards', 999)).toBe(false)
      expect(result.current.isAtLimit('dashboard.timeRangeDays', 999)).toBe(false)
    })
  })

  describe('remaining', () => {
    it('returns correct difference for free users', () => {
      vi.mocked(useSubscription).mockReturnValue({
        subscription: null,
        isPro: false,
        isExpiringSoon: false,
        daysRemaining: null,
        isLoading: false,
      })

      const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

      expect(result.current.remaining('creditCards', 1)).toBe(1)
      expect(result.current.remaining('categories.custom', 3)).toBe(2)
      expect(result.current.remaining('dashboard.timeRangeDays', 10)).toBe(20)
    })

    it('returns Infinity for pro users', () => {
      vi.mocked(useSubscription).mockReturnValue({
        subscription: null,
        isPro: true,
        isExpiringSoon: false,
        daysRemaining: null,
        isLoading: false,
      })

      const { result } = renderHook(() => usePlanLimits(), { wrapper: createWrapper() })

      expect(result.current.remaining('creditCards', 100)).toBe(Number.POSITIVE_INFINITY)
      expect(result.current.remaining('categories.custom', 100)).toBe(Number.POSITIVE_INFINITY)
      expect(result.current.remaining('dashboard.timeRangeDays', 100)).toBe(
        Number.POSITIVE_INFINITY
      )
    })
  })
})
