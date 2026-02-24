import { ThemeProvider } from '@/components/theme-provider'
import { analytics } from '@/lib/analytics'
import { referralService } from '@/services/referral.service'
import { useAuthStore } from '@/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferralLandingPage } from '../referral-landing.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: Record<string, unknown>) => (
    <a href={to as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
  useParams: () => ({ code: 'test-code' }),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/analytics', () => ({
  analytics: {
    referralLinkViewed: vi.fn(),
  },
}))

vi.mock('@/services/referral.service', () => ({
  referralService: {
    validateCode: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockNavigate = vi.fn()

function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

describe('ReferralLandingPage Integration', () => {
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

  describe('loading state', () => {
    it('renders loading skeleton initially', () => {
      vi.mocked(referralService.validateCode).mockReturnValue(new Promise(() => {}))

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('valid referral code', () => {
    it('renders referrer name when code is valid', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Maria te convidou para o Plim!')).toBeInTheDocument()
      })
    })

    it('renders description about Pro trial', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Crie sua conta e ganhe 7 dias de Pro grátis')).toBeInTheDocument()
      })
    })

    it('CTA links to /sign-up with ref param', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const ctaLink = screen.getByRole('link', { name: /Criar conta grátis/i })
        expect(ctaLink).toBeInTheDocument()
        expect(ctaLink).toHaveAttribute('href', '/sign-up?ref=test-code')
      })
    })

    it('shows sign-in link', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const signInLink = screen.getByRole('link', { name: /Entrar/i })
        expect(signInLink).toBeInTheDocument()
        expect(signInLink).toHaveAttribute('href', '/sign-in')
      })
    })
  })

  describe('invalid referral code', () => {
    it('renders generic invite card when code is invalid', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: false, referrer_name: null },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Você foi convidado para o Plim!')).toBeInTheDocument()
      })
    })

    it('renders generic card when API returns error', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        error: { code: 'NOT_FOUND', message: 'Code not found' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Você foi convidado para o Plim!')).toBeInTheDocument()
      })
    })

    it('renders generic card when API throws', async () => {
      vi.mocked(referralService.validateCode).mockRejectedValue(new Error('Network error'))

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Você foi convidado para o Plim!')).toBeInTheDocument()
      })
    })

    it('still links to /sign-up without ref param', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: false, referrer_name: null },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const ctaLink = screen.getByRole('link', { name: /Criar conta grátis/i })
        expect(ctaLink).toBeInTheDocument()
        expect(ctaLink).toHaveAttribute('href', '/sign-up')
      })
    })
  })

  describe('localStorage', () => {
    it('stores referral code in localStorage', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(localStorage.getItem('plim_referral_code')).toBe('test-code')
      })
    })
  })

  describe('analytics', () => {
    it('fires referralLinkViewed event with the referral code', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(analytics.referralLinkViewed).toHaveBeenCalledWith('test-code')
      })
    })
  })

  describe('authenticated user redirect', () => {
    it('redirects authenticated users to home', async () => {
      const { toast } = await import('sonner')

      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com' } as ReturnType<
          typeof useAuthStore.getState
        >['user'],
        isInitialized: true,
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/home' })
        expect(toast.info).toHaveBeenCalledWith('Você já está logado!')
      })
    })
  })

  describe('API call', () => {
    it('calls validateCode with the route param code', async () => {
      vi.mocked(referralService.validateCode).mockResolvedValue({
        data: { valid: true, referrer_name: 'Maria' },
      })

      render(<ReferralLandingPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(referralService.validateCode).toHaveBeenCalledWith('test-code')
      })
    })
  })
})
