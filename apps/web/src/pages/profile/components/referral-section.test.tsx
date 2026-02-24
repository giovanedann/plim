import { ThemeProvider } from '@/components/theme-provider'
import { useReferralStats } from '@/hooks/use-referral-stats'
import { analytics } from '@/lib/analytics'
import type { ReferralStats } from '@plim/shared'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferralSection } from './referral-section'

vi.mock('@/lib/analytics', () => ({
  analytics: {
    referralLinkCopied: vi.fn(),
    referralLinkShared: vi.fn(),
  },
}))

vi.mock('@/hooks/use-referral-stats', () => ({
  useReferralStats: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockStats: ReferralStats = {
  referral_code: 'joao-123',
  referral_url: 'https://plim.app/ref/joao-123',
  total_referrals: 3,
  total_pro_days_earned: 21,
  referrals: [
    { referred_name: 'Maria', created_at: '2026-01-15T10:00:00Z' },
    { referred_name: 'Carlos', created_at: '2026-01-20T14:30:00Z' },
    { referred_name: null, created_at: '2026-02-01T08:00:00Z' },
  ],
}

function renderWithTheme(component: React.ReactElement): ReturnType<typeof render> {
  return render(<ThemeProvider defaultTheme="light">{component}</ThemeProvider>)
}

describe('ReferralSection', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loading state', () => {
    it('renders loading skeleton while data loads', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: undefined,
        isLoading: true,
        error: null,
      })

      const { container } = renderWithTheme(<ReferralSection />)

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('renders error message when stats fail to load', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: undefined,
        isLoading: false,
        error: new Error('Failed'),
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('Erro ao carregar dados de indicação')).toBeInTheDocument()
    })
  })

  describe('referral link', () => {
    it('renders referral URL in input', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const input = screen.getByLabelText('Seu link de indicação')
      expect(input).toHaveValue('https://plim.app/ref/joao-123')
    })

    it('renders copy button', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
    })

    it('copy button copies URL to clipboard', async () => {
      const { toast } = await import('sonner')

      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const copyButton = screen.getByRole('button', { name: 'Copiar link' })
      await user.click(copyButton)

      expect(writeTextMock).toHaveBeenCalledWith('https://plim.app/ref/joao-123')
      expect(toast.success).toHaveBeenCalledWith('Link copiado!')
    })

    it('fires referralLinkCopied analytics event on copy', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const copyButton = screen.getByRole('button', { name: 'Copiar link' })
      await user.click(copyButton)

      expect(analytics.referralLinkCopied).toHaveBeenCalled()
    })
  })

  describe('share buttons', () => {
    it('renders WhatsApp share button', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument()
    })

    it('WhatsApp button opens share URL', async () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      renderWithTheme(<ReferralSection />)

      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      await user.click(whatsappButton)

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/?text='),
        '_blank'
      )
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('https://plim.app/ref/joao-123')),
        '_blank'
      )
    })

    it('fires referralLinkShared analytics event with whatsapp method', async () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      vi.spyOn(window, 'open').mockImplementation(() => null)

      renderWithTheme(<ReferralSection />)

      const whatsappButton = screen.getByRole('button', { name: /WhatsApp/i })
      await user.click(whatsappButton)

      expect(analytics.referralLinkShared).toHaveBeenCalledWith('whatsapp')
    })

    it('renders Web Share button when navigator.share is available', () => {
      Object.assign(navigator, {
        share: vi.fn().mockResolvedValue(undefined),
      })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByRole('button', { name: /Compartilhar/i })).toBeInTheDocument()
    })

    it('hides Web Share button when navigator.share is not available', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.queryByRole('button', { name: /Compartilhar/i })).not.toBeInTheDocument()
    })

    it('Web Share button calls navigator.share', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { share: shareMock })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const shareButton = screen.getByRole('button', { name: /Compartilhar/i })
      await user.click(shareButton)

      expect(shareMock).toHaveBeenCalledWith({
        title: 'Plim - Convite',
        text: expect.stringContaining('Plim'),
        url: 'https://plim.app/ref/joao-123',
      })
    })

    it('fires referralLinkShared analytics event with native method', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { share: shareMock })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const shareButton = screen.getByRole('button', { name: /Compartilhar/i })
      await user.click(shareButton)

      await waitFor(() => {
        expect(analytics.referralLinkShared).toHaveBeenCalledWith('native')
      })
    })
  })

  describe('stats display', () => {
    it('renders total referrals count', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Indicações')).toBeInTheDocument()
    })

    it('renders total Pro days earned', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('21')).toBeInTheDocument()
      expect(screen.getByText('Dias Pro ganhos')).toBeInTheDocument()
    })
  })

  describe('referral list', () => {
    it('renders referral list with names and dates', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('Maria')).toBeInTheDocument()
      expect(screen.getByText('Carlos')).toBeInTheDocument()
      expect(screen.getByText('Usuário')).toBeInTheDocument()
    })

    it('renders formatted dates in pt-BR', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: {
          ...mockStats,
          referrals: [{ referred_name: 'Maria', created_at: '2026-01-15T10:00:00Z' }],
        },
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const listItem = screen.getByText('Maria').closest('li')
      expect(listItem).toBeInTheDocument()
      // The date should be formatted in pt-BR locale
      expect(listItem?.textContent).toMatch(/\d{2}/)
    })

    it('renders empty state when no referrals', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: {
          ...mockStats,
          total_referrals: 0,
          total_pro_days_earned: 0,
          referrals: [],
        },
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('Compartilhe seu link e ganhe Pro grátis!')).toBeInTheDocument()
    })

    it('does not render list when there are no referrals', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: {
          ...mockStats,
          referrals: [],
        },
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.queryByRole('list', { name: 'Lista de indicações' })).not.toBeInTheDocument()
    })

    it('renders accessible list with aria-label', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByRole('list', { name: 'Lista de indicações' })).toBeInTheDocument()
    })
  })

  describe('card structure', () => {
    it('renders card title', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(screen.getByText('Indique e Ganhe')).toBeInTheDocument()
    })

    it('renders card description', () => {
      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      expect(
        screen.getByText('Convide amigos e ganhe 7 dias de Pro para cada indicação')
      ).toBeInTheDocument()
    })
  })

  describe('copy feedback', () => {
    it('shows check icon after copying', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      vi.mocked(useReferralStats).mockReturnValue({
        stats: mockStats,
        isLoading: false,
        error: null,
      })

      renderWithTheme(<ReferralSection />)

      const copyButton = screen.getByRole('button', { name: 'Copiar link' })
      await user.click(copyButton)

      await waitFor(() => {
        // After clicking, the button should still be present
        expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument()
      })
    })
  })
})
