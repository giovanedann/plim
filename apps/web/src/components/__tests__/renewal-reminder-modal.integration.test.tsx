import { ThemeProvider } from '@/components/theme-provider'
import { paymentService } from '@/services/payment.service'
import type { SubscriptionStatusResponse } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RenewalReminderModal } from '../renewal-reminder-modal'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
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

const STORAGE_KEY = 'plim:dismiss-renewal-modal'

const EXPIRING_SOON_STATUS: SubscriptionStatusResponse = {
  tier: 'pro',
  payment_method: 'pix',
  current_period_start: '2026-01-01T00:00:00Z',
  current_period_end: '2026-02-10T00:00:00Z',
  mp_payment_status: 'approved',
  is_expiring_soon: true,
  days_remaining: 5,
}

const EXPIRED_STATUS: SubscriptionStatusResponse = {
  tier: 'pro',
  payment_method: 'pix',
  current_period_start: '2026-01-01T00:00:00Z',
  current_period_end: '2026-02-01T00:00:00Z',
  mp_payment_status: 'approved',
  is_expiring_soon: true,
  days_remaining: 0,
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

describe('RenewalReminderModal Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    localStorage.removeItem(STORAGE_KEY)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(STORAGE_KEY)
  })

  describe('visibility', () => {
    it('shows when expiring soon', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_SOON_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expira em 5 dias/)).toBeInTheDocument()
      })
    })

    it('shows when expired', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRED_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expirou/)).toBeInTheDocument()
      })
    })

    it('is hidden for free users', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.queryByText(/Seu plano Pro/)).not.toBeInTheDocument()
      })
    })
  })

  describe('dismiss behaviors', () => {
    it('"Me lembre depois" dismisses for session only', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_SOON_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expira em 5 dias/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Me lembre depois/i }))

      await waitFor(() => {
        expect(screen.queryByText(/Seu plano Pro expira em 5 dias/)).not.toBeInTheDocument()
      })

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('"Nao quero mais ver isso" permanently dismisses via localStorage', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_SOON_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expira em 5 dias/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Nao quero mais ver isso/i }))

      await waitFor(() => {
        expect(screen.queryByText(/Seu plano Pro expira em 5 dias/)).not.toBeInTheDocument()
      })

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(state.type).toBe('expiring-soon')
    })
  })

  describe('state transition re-shows modal', () => {
    it('re-shows on state transition from expiring-soon to expired', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ type: 'expiring-soon', dismissedAt: Date.now() })
      )

      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRED_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expirou/)).toBeInTheDocument()
      })
    })
  })

  describe('navigation', () => {
    it('"Renovar agora" navigates to /upgrade', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: EXPIRING_SOON_STATUS,
      })

      render(<RenewalReminderModal />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Seu plano Pro expira em 5 dias/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Renovar agora/i }))

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/upgrade' })
    })
  })
})
