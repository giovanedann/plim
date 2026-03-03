import { dashboardService } from '@/services/dashboard.service'
import type { ApiSuccessResponse, DashboardData } from '@plim/shared'
import { resetIdCounter } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '../dashboard.page'

let mockIsPro = false

vi.mock('@/hooks/use-plan-limits', () => ({
  usePlanLimits: () => ({
    isPro: mockIsPro,
    isLoading: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

const mockDashboardData = {
  summary: {
    total_income: 500000,
    total_expenses: 300000,
    balance: 200000,
    savings_rate: 0.4,
    comparison: {
      income_change_percent: 0,
      expenses_change_percent: 0,
      balance_change_percent: 0,
    },
  },
  expensesTimeline: {
    data: [
      { date: '2024-01-01', amount: 10000 },
      { date: '2024-01-02', amount: 15000 },
    ],
    group_by: 'day' as const,
  },
  incomeVsExpenses: {
    data: [{ month: '2024-01', income: 50000, expenses: 30000 }],
  },
  categoryBreakdown: {
    data: [
      {
        category_id: 'cat-1',
        name: 'Alimentação',
        icon: 'utensils',
        color: '#FF0000',
        amount: 100000,
        percentage: 0.33,
      },
      {
        category_id: 'cat-2',
        name: 'Transporte',
        icon: 'car',
        color: '#00FF00',
        amount: 80000,
        percentage: 0.27,
      },
    ],
    total: 180000,
  },
  paymentBreakdown: {
    data: [
      { method: 'pix', amount: 150000, percentage: 0.5 },
      { method: 'credit_card', amount: 150000, percentage: 0.5 },
    ],
    total: 300000,
  },
  creditCardBreakdown: {
    data: [
      {
        credit_card_id: 'card-1',
        name: 'Nubank',
        color: '#8A05BE',
        bank: 'nubank',
        flag: 'visa',
        amount: 150000,
        percentage: 1.0,
      },
    ],
    total: 150000,
  },
  savingsRate: {
    data: [{ month: '2024-01', rate: 0.4 }],
  },
  salaryTimeline: {
    data: [{ date: '2024-01', amount: 500000 }],
  },
  installmentForecast: {
    data: [
      { month: '2024-02', total: 50000 },
      { month: '2024-03', total: 50000 },
    ],
  },
  creditCardUtilization: { data: [] },
  recurringVsOnetime: {
    recurring_amount: 0,
    onetime_amount: 300000,
    recurring_percentage: 0,
    onetime_percentage: 100,
  },
  dayOfWeek: null,
  invoiceCalendar: null,
  spendingLimitProgress: null,
  expenseForecast: null,
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function renderDashboard(): ReturnType<typeof render> {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  )
}

describe('DashboardPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    mockIsPro = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('dashboard service integration', () => {
    it('fetches dashboard data with correct parameters', async () => {
      const getDashboardSpy = vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        group_by: 'day',
      })

      expect(getDashboardSpy).toHaveBeenCalledWith({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        group_by: 'day',
      })
    })

    it('returns complete dashboard data structure', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        group_by: 'day',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.summary).toBeDefined()
      expect(result.data.expensesTimeline).toBeDefined()
      expect(result.data.categoryBreakdown).toBeDefined()
      expect(result.data.paymentBreakdown).toBeDefined()
    })

    it('handles summary data correctly', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.summary.total_income).toBe(500000)
      expect(result.data.summary.total_expenses).toBe(300000)
      expect(result.data.summary.balance).toBe(200000)
      expect(result.data.summary.savings_rate).toBe(0.4)
    })

    it('handles category breakdown data', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.categoryBreakdown.data).toHaveLength(2)
      expect(result.data.categoryBreakdown.data[0]!.name).toBe('Alimentação')
      expect(result.data.categoryBreakdown.data[1]!.name).toBe('Transporte')
    })

    it('handles expenses timeline data', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        group_by: 'day',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.expensesTimeline.data).toHaveLength(2)
      expect(result.data.expensesTimeline.group_by).toBe('day')
    })

    it('handles payment breakdown data', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.paymentBreakdown.data).toHaveLength(2)
      expect(result.data.paymentBreakdown.total).toBe(300000)
    })

    it('handles installment forecast data', async () => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })

      const result = (await dashboardService.getDashboard({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })) as ApiSuccessResponse<DashboardData>

      expect(result.data.installmentForecast!.data).toHaveLength(2)
      expect(result.data.installmentForecast!.data[0]!.month).toBe('2024-02')
    })
  })

  describe('chart gating behavior', () => {
    beforeEach(() => {
      vi.spyOn(dashboardService, 'getDashboard').mockResolvedValue({
        data: mockDashboardData,
      })
    })

    describe('free user', () => {
      beforeEach(() => {
        mockIsPro = false
      })

      it('shows ProChartLock for Receita vs Despesas chart', async () => {
        renderDashboard()

        const titles = await screen.findAllByText('Receita vs Despesas')
        expect(titles.length).toBeGreaterThan(0)
      })

      it('shows ProChartLock for Taxa de Economia chart', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const titles = screen.getAllByText('Taxa de Economia')
          expect(titles.length).toBeGreaterThan(0)
        })
      })

      it('shows ProChartLock for Gastos por Cartão chart', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const titles = screen.getAllByText('Gastos por Cartão')
          expect(titles.length).toBeGreaterThan(0)
        })
      })

      it('shows ProChartLock for Top Categorias chart', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const titles = screen.getAllByText('Top Categorias')
          expect(titles.length).toBeGreaterThan(0)
        })
      })

      it('shows ProChartLock for Histórico de Salários chart', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const titles = screen.getAllByText('Histórico de Salários')
          expect(titles.length).toBeGreaterThan(0)
        })
      })

      it('shows ProChartLock for Previsão de Parcelas chart', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const titles = screen.getAllByText('Previsão de Parcelas')
          expect(titles.length).toBeGreaterThan(0)
        })
      })

      it('shows all 6 ProChartLock overlays with correct titles', async () => {
        renderDashboard()

        await screen.findAllByText('Receita vs Despesas')

        const lockedChartTitles = [
          'Receita vs Despesas',
          'Taxa de Economia',
          'Gastos por Cartão',
          'Top Categorias',
          'Histórico de Salários',
          'Previsão de Parcelas',
        ]

        for (const title of lockedChartTitles) {
          const elements = screen.getAllByText(title)
          expect(elements.length).toBeGreaterThan(0)
        }
      })

      it('shows "Disponível no plano Pro" text for all locked charts', async () => {
        renderDashboard()

        await screen.findByText('Receita vs Despesas')

        const proTexts = screen.getAllByText('Disponível no plano Pro')
        expect(proTexts).toHaveLength(6)
      })

      it('shows "Seja Pro" links for all locked charts', async () => {
        renderDashboard()

        await screen.findByText('Receita vs Despesas')

        const sejaProLinks = screen.getAllByRole('link', { name: /seja pro/i })
        expect(sejaProLinks).toHaveLength(6)

        for (const link of sejaProLinks) {
          expect(link).toHaveAttribute('href', '/upgrade')
        }
      })

      it('shows lock icons for all locked charts', async () => {
        renderDashboard()

        await screen.findByText('Receita vs Despesas')

        const container = screen.getByText('Receita vs Despesas').closest('div[class*="absolute"]')
        expect(container).toBeInTheDocument()
        expect(
          within(container as HTMLElement).getByText('Receita vs Despesas')
        ).toBeInTheDocument()
      })

      it('does NOT show ProChartLock for free charts', async () => {
        renderDashboard()

        await screen.findByText('Receita vs Despesas')

        const freeChartTitles = ['Linha do Tempo', 'Despesas por Categoria', 'Formas de Pagamento']

        for (const title of freeChartTitles) {
          const elements = screen.queryAllByText(title)
          expect(elements.length).toBeGreaterThan(0)
        }

        expect(screen.getAllByText('Disponível no plano Pro')).toHaveLength(6)
      })
    })

    describe('pro user', () => {
      beforeEach(() => {
        mockIsPro = true
      })

      it('does NOT show any ProChartLock overlays', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          expect(screen.queryByText('Disponível no plano Pro')).not.toBeInTheDocument()
        })
      })

      it('does NOT show "Seja Pro" links', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          const sejaProLinks = screen.queryAllByRole('link', { name: /seja pro/i })
          expect(sejaProLinks).toHaveLength(0)
        })
      })

      it('does NOT show lock overlays for previously locked charts', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          expect(screen.queryByText('Receita vs Despesas')).not.toBeInTheDocument()
          expect(screen.queryByText('Taxa de Economia')).not.toBeInTheDocument()
          expect(screen.queryByText('Gastos por Cartão')).not.toBeInTheDocument()
          expect(screen.queryByText('Top Categorias')).not.toBeInTheDocument()
          expect(screen.queryByText('Histórico de Salários')).not.toBeInTheDocument()
          expect(screen.queryByText('Previsão de Parcelas')).not.toBeInTheDocument()
        })
      })

      it('renders actual chart components instead of ProChartLock', async () => {
        renderDashboard()

        await vi.waitFor(() => {
          expect(screen.queryByText('Disponível no plano Pro')).not.toBeInTheDocument()
        })

        const proChartCount = screen.queryAllByText('Disponível no plano Pro').length
        expect(proChartCount).toBe(0)
      })
    })
  })
})
