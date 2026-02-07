import { ThemeProvider } from '@/components/theme-provider'
import { paymentService } from '@/services/payment.service'
import type { SubscriptionStatusResponse } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpgradePage } from '../upgrade.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('../components/pix-payment-dialog', () => ({
  PixPaymentDialog: ({ open }: { open: boolean }) =>
    open ? (
      <dialog open aria-label="PIX Payment">
        PIX Dialog
      </dialog>
    ) : null,
}))

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

const FREE_STATUS: SubscriptionStatusResponse = {
  tier: 'free',
  payment_method: null,
  current_period_start: null,
  current_period_end: null,
  mp_payment_status: null,
  is_expiring_soon: false,
  days_remaining: null,
}

const PRO_STATUS: SubscriptionStatusResponse = {
  tier: 'pro',
  payment_method: 'pix',
  current_period_start: '2026-01-01T12:00:00Z',
  current_period_end: '2026-01-31T12:00:00Z',
  mp_payment_status: 'approved',
  is_expiring_soon: false,
  days_remaining: 20,
}

const PRO_FORMATTED_DATE = new Date('2026-01-31T12:00:00Z').toLocaleDateString('pt-BR')

const EXPIRING_PRO_STATUS: SubscriptionStatusResponse = {
  ...PRO_STATUS,
  is_expiring_soon: true,
  days_remaining: 3,
}

describe('UpgradePage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('free user', () => {
    it('renders price and perks list', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('R$ 24,90')).toBeInTheDocument()
      })

      expect(screen.getByText(/100 requisicoes de texto/)).toBeInTheDocument()
      expect(screen.getByText(/20 requisicoes de imagem/)).toBeInTheDocument()
      expect(screen.getByText(/15 requisicoes de voz/)).toBeInTheDocument()
    })

    it('renders "Pagar com PIX" button', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pagar com PIX/i })).toBeInTheDocument()
      })
    })
  })

  describe('pro user', () => {
    it('renders "Ativo" badge and expiration date', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: PRO_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Ativo')).toBeInTheDocument()
      })

      expect(screen.getByText(PRO_FORMATTED_DATE)).toBeInTheDocument()
    })

    it('renders "Renovar assinatura" button', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: PRO_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Renovar assinatura/i })).toBeInTheDocument()
      })
    })

    it('shows progress bar', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: PRO_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Periodo atual')).toBeInTheDocument()
      })

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('expiring pro user', () => {
    it('renders warning banner with days remaining', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_PRO_STATUS,
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano expira em 3 dias/)).toBeInTheDocument()
      })
    })

    it('applies amber border to the card', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_PRO_STATUS,
      })

      const { container } = render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Ativo')).toBeInTheDocument()
      })

      const amberBorderCards = container.querySelectorAll('[class*="border-amber"]')
      expect(amberBorderCards.length).toBeGreaterThan(0)
    })
  })

  describe('PIX payment flow', () => {
    it('calls createPixPayment and opens dialog on click', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      const createPixSpy = vi.spyOn(paymentService, 'createPixPayment').mockResolvedValue({
        data: {
          qr_code_base64: 'base64data',
          pix_copia_cola: 'pix-code',
          mp_payment_id: 'mp-123',
          expires_at: '2026-02-01T00:00:00Z',
        },
      })

      render(<UpgradePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pagar com PIX/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Pagar com PIX/i }))

      await waitFor(() => {
        expect(createPixSpy).toHaveBeenCalledOnce()
      })

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /PIX Payment/ })).toBeInTheDocument()
      })
    })
  })

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockImplementation(
        () => new Promise(() => {})
      )

      const { container } = render(<UpgradePage />, { wrapper: TestWrapper })

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })
})
