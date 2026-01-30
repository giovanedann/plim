import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfile } from './use-profile'

vi.mock('@/services/profile.service', () => ({
  profileService: {
    getProfile: vi.fn(),
  },
}))

import { profileService } from '@/services/profile.service'

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

describe('useProfile', () => {
  const mockProfile = {
    user_id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns profile data when fetch succeeds', async () => {
    const sut = useProfile
    vi.mocked(profileService.getProfile).mockResolvedValue({
      data: mockProfile,
    })

    const { result } = renderHook(() => sut(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.error).toBeNull()
  })

  it('returns loading state initially', () => {
    const sut = useProfile
    vi.mocked(profileService.getProfile).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => sut(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.profile).toBeUndefined()
  })

  it('returns error when fetch fails with error response', async () => {
    const sut = useProfile
    vi.mocked(profileService.getProfile).mockResolvedValue({
      error: { code: 'NOT_FOUND', message: 'Profile not found' },
    })

    const { result } = renderHook(() => sut(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Profile not found')
    expect(result.current.profile).toBeUndefined()
  })

  it('returns error when fetch throws', async () => {
    const sut = useProfile
    vi.mocked(profileService.getProfile).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => sut(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
    expect(result.current.profile).toBeUndefined()
  })

  it('calls profileService.getProfile', async () => {
    const sut = useProfile
    vi.mocked(profileService.getProfile).mockResolvedValue({
      data: mockProfile,
    })

    renderHook(() => sut(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(profileService.getProfile).toHaveBeenCalledTimes(1)
    })
  })
})
