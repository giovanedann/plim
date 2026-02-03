import { dashboardService } from '@/services/dashboard.service'
import type { ApiSuccessResponse, DashboardData } from '@plim/shared'
import { resetIdCounter } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
}

describe('DashboardPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
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

      expect(result.data.installmentForecast.data).toHaveLength(2)
      expect(result.data.installmentForecast.data[0]!.month).toBe('2024-02')
    })
  })
})
