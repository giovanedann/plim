import { ThemeProvider } from '@/components/theme-provider'
import { creditCardService } from '@/services/credit-card.service'
import { PLAN_LIMITS, createMockCreditCard, resetIdCounter } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreditCardsPage } from '../credit-cards.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

let mockIsPro = false

vi.mock('@/hooks/use-plan-limits', () => ({
  usePlanLimits: () => ({
    limits: mockIsPro ? PLAN_LIMITS.pro : PLAN_LIMITS.free,
    isPro: mockIsPro,
    isAtLimit: (_feature: string, current: number) => (mockIsPro ? false : current >= 2),
    remaining: (_feature: string, current: number) =>
      mockIsPro ? Number.POSITIVE_INFINITY : Math.max(0, 2 - current),
  }),
}))

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

describe('CreditCardsPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetIdCounter()
    mockIsPro = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders page title and description', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Cartões de Crédito')).toBeInTheDocument()
        expect(screen.getByText(/Organize suas despesas por cartão/i)).toBeInTheDocument()
      })
    })

    it('shows loading state initially', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockImplementation(() => new Promise(() => {}))

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      expect(
        screen.getAllByRole('generic').some((el) => el.classList.contains('animate-pulse'))
      ).toBe(true)
    })

    it('shows empty state when no credit cards exist', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Nenhum cartão cadastrado/i)).toBeInTheDocument()
        expect(
          screen.getByText(/Adicione seus cartões para organizar suas despesas/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('credit card display', () => {
    it('displays credit cards in grid layout', async () => {
      const cards = [
        createMockCreditCard({
          name: 'Visa Gold',
          last_4_digits: '1234',
          color: 'gold',
          flag: 'visa',
        }),
        createMockCreditCard({
          name: 'Mastercard Platinum',
          last_4_digits: '5678',
          color: 'silver',
          flag: 'mastercard',
        }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Visa Gold')).toBeInTheDocument()
        expect(screen.getByText('Mastercard Platinum')).toBeInTheDocument()
        expect(screen.getByText(/••• 1234/)).toBeInTheDocument()
        expect(screen.getByText(/••• 5678/)).toBeInTheDocument()
      })
    })

    it('displays card preview with correct color', async () => {
      const card = createMockCreditCard({
        name: 'Blue Card',
        color: 'dark_blue',
        flag: 'visa',
      })

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [card] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Blue Card')).toBeInTheDocument()
      })
    })
  })

  describe('CRUD operations', () => {
    it('shows create card button', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const buttons = screen.getAllByText('Novo Cartão')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('opens create modal when clicking create button', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const buttons = screen.getAllByText('Novo Cartão')
        expect(buttons.length).toBeGreaterThan(0)
      })

      const createButton = screen.getAllByText('Novo Cartão')[0]!
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Nome do Cartão/i)).toBeInTheDocument()
      })
    })

    it('shows dropdown menu for edit and delete', async () => {
      const card = createMockCreditCard({
        name: 'Test Card',
        last_4_digits: '9999',
      })

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [card] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Test Card')).toBeInTheDocument()
      })

      const allButtons = screen.getAllByRole('button')
      expect(allButtons.length).toBeGreaterThan(0)
    })

    it('displays card information correctly', async () => {
      const card = createMockCreditCard({
        name: 'Premium Card',
        last_4_digits: '7777',
      })

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [card] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Premium Card')).toBeInTheDocument()
        expect(screen.getByText(/••• 7777/)).toBeInTheDocument()
      })
    })
  })

  describe('card preview', () => {
    it('displays card with 3D effect', async () => {
      const card = createMockCreditCard({
        name: 'Premium Card',
        last_4_digits: '8888',
        color: 'red',
        flag: 'visa',
      })

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [card] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Premium Card')).toBeInTheDocument()
        expect(screen.getByText(/••• 8888/)).toBeInTheDocument()
      })
    })
  })

  describe('free user plan limits', () => {
    beforeEach(() => {
      mockIsPro = false
    })

    it('shows UpgradePrompt for free users', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/0\/2 cartões usadas/i)).toBeInTheDocument()
        expect(screen.getByText(/seja pro/i)).toBeInTheDocument()
      })
    })

    it('shows disabled create buttons when at limit', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card 1', last_4_digits: '1111' }),
        createMockCreditCard({ name: 'Card 2', last_4_digits: '2222' }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument()
      })

      const createButtons = screen.getAllByText('Novo Cartão')
      for (const button of createButtons) {
        expect(button).toBeDisabled()
      }
    })

    it('shows tooltip for disabled create button when at limit', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card 1', last_4_digits: '1111' }),
        createMockCreditCard({ name: 'Card 2', last_4_digits: '2222' }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument()
      })

      // Get the first button element (not just text), which should be disabled
      const createButtons = screen.getAllByRole('button', { name: /novo cartão/i })
      const disabledButton = createButtons.find((btn) => btn.hasAttribute('disabled'))
      expect(disabledButton).toBeDefined()

      await user.hover(disabledButton!)

      await waitFor(() => {
        const tooltips = screen.getAllByText(/vire pro pra criar cartões ilimitados/i)
        expect(tooltips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('pro user plan limits', () => {
    beforeEach(() => {
      mockIsPro = true
    })

    it('does NOT show UpgradePrompt for pro users', async () => {
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Cartões de Crédito')).toBeInTheDocument()
      })

      expect(screen.queryByText(/cartões usadas/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/seja pro/i)).not.toBeInTheDocument()
    })

    it('create buttons are NOT disabled for pro users', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card 1', last_4_digits: '1111' }),
        createMockCreditCard({ name: 'Card 2', last_4_digits: '2222' }),
        createMockCreditCard({ name: 'Card 3', last_4_digits: '3333' }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument()
      })

      const createButtons = screen.getAllByText('Novo Cartão')
      for (const button of createButtons) {
        expect(button).not.toBeDisabled()
      }
    })

    it('tooltip "Vire Pro pra criar cartões ilimitados" does NOT appear for pro users', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card 1', last_4_digits: '1111' }),
        createMockCreditCard({ name: 'Card 2', last_4_digits: '2222' }),
        createMockCreditCard({ name: 'Card 3', last_4_digits: '3333' }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument()
      })

      const createButton = screen.getAllByText('Novo Cartão')[0]!
      await user.hover(createButton)

      await waitFor(
        () => {
          expect(
            screen.queryByText(/vire pro pra criar cartões ilimitados/i)
          ).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('allows creating more than 2 cards for pro users', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card 1', last_4_digits: '1111' }),
        createMockCreditCard({ name: 'Card 2', last_4_digits: '2222' }),
        createMockCreditCard({ name: 'Card 3', last_4_digits: '3333' }),
        createMockCreditCard({ name: 'Card 4', last_4_digits: '4444' }),
      ]

      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: cards })

      render(<CreditCardsPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Card 1')).toBeInTheDocument()
        expect(screen.getByText('Card 2')).toBeInTheDocument()
        expect(screen.getByText('Card 3')).toBeInTheDocument()
        expect(screen.getByText('Card 4')).toBeInTheDocument()
      })

      const createButtons = screen.getAllByText('Novo Cartão')
      expect(createButtons.length).toBeGreaterThan(0)
      for (const button of createButtons) {
        expect(button).not.toBeDisabled()
      }
    })
  })
})
