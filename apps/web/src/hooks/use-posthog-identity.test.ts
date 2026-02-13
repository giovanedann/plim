import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostHogIdentity } from './use-posthog-identity'

const mockIdentify = vi.fn()
const mockReset = vi.fn()
const mockGetPostHog = vi.fn()

vi.mock('@/lib/posthog', () => ({
  getPostHog: () => mockGetPostHog(),
}))

const mockUser = vi.fn()
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) => selector({ user: mockUser() }),
}))

vi.mock('@/stores/consent.store', () => ({
  useConsentStore: vi.fn((selector: any) => selector({ analyticsConsent: 'granted' })),
}))

describe('usePostHogIdentity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser.mockReturnValue(null)
    mockGetPostHog.mockReturnValue({
      identify: mockIdentify,
      reset: mockReset,
    })
  })

  it('calls identify with user data when user is logged in', () => {
    mockUser.mockReturnValue({ id: 'user-123', email: 'test@example.com' })

    renderHook(() => usePostHogIdentity())

    expect(mockIdentify).toHaveBeenCalledWith('user-123', { email: 'test@example.com' })
  })

  it('calls reset when user signs out after being identified', () => {
    mockUser.mockReturnValue({ id: 'user-123', email: 'test@example.com' })
    const { rerender } = renderHook(() => usePostHogIdentity())

    expect(mockIdentify).toHaveBeenCalled()

    mockUser.mockReturnValue(null)
    rerender()

    expect(mockReset).toHaveBeenCalled()
  })

  it('does not call reset when user was never identified', () => {
    mockUser.mockReturnValue(null)

    renderHook(() => usePostHogIdentity())

    expect(mockReset).not.toHaveBeenCalled()
  })

  it('does not call identify or reset when PostHog is not initialized', () => {
    mockGetPostHog.mockReturnValue(null)
    mockUser.mockReturnValue({ id: 'user-123', email: 'test@example.com' })

    renderHook(() => usePostHogIdentity())

    expect(mockIdentify).not.toHaveBeenCalled()
    expect(mockReset).not.toHaveBeenCalled()
  })

  it('calls identify on user change', () => {
    mockUser.mockReturnValue({ id: 'user-123', email: 'test@example.com' })
    const { rerender } = renderHook(() => usePostHogIdentity())

    expect(mockIdentify).toHaveBeenCalledWith('user-123', { email: 'test@example.com' })

    mockUser.mockReturnValue({ id: 'user-456', email: 'new@example.com' })
    rerender()

    expect(mockIdentify).toHaveBeenCalledWith('user-456', { email: 'new@example.com' })
  })
})
