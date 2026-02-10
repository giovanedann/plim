import { ThemeProvider } from '@/components/theme-provider'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

describe('AuthCallbackPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
