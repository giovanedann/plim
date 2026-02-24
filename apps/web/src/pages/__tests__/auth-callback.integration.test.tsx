import { ThemeProvider } from '@/components/theme-provider'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { referralService } from '@/services/referral.service'
import { useAuthStore } from '@/stores/auth.store'
import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthCallbackPage } from '../auth-callback.page'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

vi.mock('@/lib/analytics', () => ({
  analytics: {
    referralClaimed: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
      getSession: vi.fn(),
    },
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/services/referral.service', () => ({
  referralService: {
    claimReferral: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()

describe('AuthCallbackPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders loading state', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Autenticando.../i)).toBeInTheDocument()
    })

    it('shows loading spinner', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      const spinner = screen.getByText(/Autenticando.../i).previousElementSibling
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('authentication flow', () => {
    it('calls exchangeCodeForSession on mount', async () => {
      const exchangeSpy = vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(exchangeSpy).toHaveBeenCalled()
      })
    })

    it('exchanges code only once', async () => {
      const exchangeSpy = vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(exchangeSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('uses current URL for code exchange', async () => {
      const exchangeSpy = vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(exchangeSpy).toHaveBeenCalledWith(window.location.href)
      })
    })
  })

  describe('error handling', () => {
    it('handles authentication errors', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid code', name: 'AuthError' } as any,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalled()
      })
    })

    it('logs error to console on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const exchangeMock = vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid code', name: 'AuthError' } as any,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(exchangeMock).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Auth callback error:', expect.any(Object))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('referral claim', () => {
    it('claims referral when localStorage has code and user is set', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createSuccessResponse({ pro_days_granted: 7 })
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(referralService.claimReferral).toHaveBeenCalledWith('test-referral')
      })
    })

    it('fires referralClaimed analytics event on successful claim', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createSuccessResponse({ pro_days_granted: 7 })
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(analytics.referralClaimed).toHaveBeenCalledWith('test-referral')
      })
    })

    it('does not fire referralClaimed when claim fails', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createErrorResponse('ALREADY_CLAIMED', 'Already claimed')
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(referralService.claimReferral).toHaveBeenCalled()
      })

      expect(analytics.referralClaimed).not.toHaveBeenCalled()
    })

    it('shows success toast on successful claim', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createSuccessResponse({ pro_days_granted: 7 })
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Você ganhou 7 dias de Pro grátis!')
      })
    })

    it('clears localStorage after successful claim', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createSuccessResponse({ pro_days_granted: 7 })
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(localStorage.getItem('plim_referral_code')).toBeNull()
      })
    })

    it('clears localStorage after failed claim', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createErrorResponse('ALREADY_CLAIMED', 'Already claimed')
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(localStorage.getItem('plim_referral_code')).toBeNull()
      })
    })

    it('does not show toast when claim fails with error response', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createErrorResponse('ALREADY_CLAIMED', 'Already claimed')
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(referralService.claimReferral).toHaveBeenCalled()
      })

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('does not crash when claim throws an exception', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockRejectedValue(new Error('Network error'))

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(localStorage.getItem('plim_referral_code')).toBeNull()
      })

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('does not call claimReferral when no referral code in localStorage', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
      })

      expect(referralService.claimReferral).not.toHaveBeenCalled()
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('navigates to home after referral claim completes', async () => {
      localStorage.setItem('plim_referral_code', 'test-referral')
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)
      vi.mocked(referralService.claimReferral).mockResolvedValue(
        createSuccessResponse({ pro_days_granted: 7 })
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      useAuthStore.setState({ user: { id: 'user-123', email: 'test@test.com' } as any })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
      })
    })
  })

  describe('loading state', () => {
    it('displays centered loading container', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<AuthCallbackPage />, { wrapper: TestWrapper })

      const loadingContainer = container.querySelector('.flex.min-h-screen')
      expect(loadingContainer).toBeInTheDocument()
    })

    it('shows loading text with proper styling', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      const loadingText = screen.getByText(/Autenticando.../i)
      expect(loadingText).toHaveClass('text-muted-foreground')
    })
  })

  describe('accessibility', () => {
    it('provides meaningful loading message', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<AuthCallbackPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Autenticando.../i)).toBeInTheDocument()
    })

    it('has visual loading indicator', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<AuthCallbackPage />, { wrapper: TestWrapper })

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('spinner styling', () => {
    it('renders spinner with correct classes', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<AuthCallbackPage />, { wrapper: TestWrapper })

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass(
        'rounded-full',
        'border-4',
        'border-primary',
        'border-t-transparent'
      )
    })
  })
})
