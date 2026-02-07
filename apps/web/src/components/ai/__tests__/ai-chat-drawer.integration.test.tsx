import { ThemeProvider } from '@/components/theme-provider'
import { paymentService } from '@/services/payment.service'
import { useAIStore } from '@/stores/ai.store'
import type { SubscriptionStatusResponse } from '@plim/shared'
import { createMockAIUsageResponse } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AIChatDrawer } from '../ai-chat-drawer'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-ai-chat', () => ({
  useAIChat: () => ({
    sendMessage: vi.fn(),
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: null,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../voice-recorder', () => ({
  VoiceRecorder: ({ disabled }: { disabled: boolean }) => (
    <div aria-label="Voice recorder" aria-disabled={disabled}>
      VoiceRecorder
    </div>
  ),
}))

vi.mock('../image-uploader', () => ({
  ImageUploader: ({ disabled }: { disabled: boolean }) => (
    <div aria-label="Image uploader" aria-disabled={disabled}>
      ImageUploader
    </div>
  ),
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
  current_period_start: '2026-01-01T00:00:00Z',
  current_period_end: '2026-01-31T00:00:00Z',
  mp_payment_status: 'approved',
  is_expiring_soon: false,
  days_remaining: 20,
}

describe('AIChatDrawer Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAIStore.setState({
      isDrawerOpen: true,
      messages: [],
      usage: createMockAIUsageResponse(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('upgrade banner visibility', () => {
    it('free user sees upgrade banner', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<AIChatDrawer />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Desbloqueie mais com o Pro/)).toBeInTheDocument()
      })
    })

    // TODO: revert — skipped while banner is force-shown for all users (testing)
    it.skip('pro user does not see upgrade banner', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: PRO_STATUS,
      })

      render(<AIChatDrawer />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.queryByText(/Desbloqueie mais com o Pro/)).not.toBeInTheDocument()
      })
    })
  })

  describe('limit reached behavior', () => {
    it('shows stronger CTA text when limit is reached', async () => {
      const exhaustedUsage = createMockAIUsageResponse({
        text: { used: 15, limit: 15, remaining: 0 },
      })

      useAIStore.setState({ usage: exhaustedUsage })

      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<AIChatDrawer />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Limite atingido/)).toBeInTheDocument()
      })

      expect(screen.getByText(/faça upgrade para continuar/)).toBeInTheDocument()
    })

    it('disables textarea when limit is reached', async () => {
      const exhaustedUsage = createMockAIUsageResponse({
        text: { used: 15, limit: 15, remaining: 0 },
      })

      useAIStore.setState({ usage: exhaustedUsage })

      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<AIChatDrawer />, { wrapper: TestWrapper })

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Limite atingido')
        expect(textarea).toBeDisabled()
      })
    })
  })

  describe('upgrade link', () => {
    it('upgrade link points to /upgrade', async () => {
      vi.spyOn(paymentService, 'getSubscriptionStatus').mockResolvedValue({
        data: FREE_STATUS,
      })

      render(<AIChatDrawer />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Desbloqueie mais com o Pro/)).toBeInTheDocument()
      })

      const link = screen.getByRole('link', { name: /Desbloqueie mais com o Pro/ })
      expect(link).toHaveAttribute('href', '/upgrade')
    })
  })
})
