import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import type { DashboardData, DashboardQuery } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dashboardService } from './dashboard.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

function createMockDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    summary: {
      total_income: 500000,
      total_expenses: 350000,
      balance: 150000,
      savings_rate: 30,
      comparison: {
        income_change_percent: 5,
        expenses_change_percent: -2,
        balance_change_percent: 15,
      },
    },
    expensesTimeline: {
      data: [
        { date: '2026-01-01', amount: 10000 },
        { date: '2026-01-02', amount: 15000 },
      ],
      group_by: 'day',
    },
    incomeVsExpenses: {
      data: [{ month: '2026-01', income: 500000, expenses: 350000 }],
    },
    categoryBreakdown: {
      data: [
        {
          category_id: 'cat-001',
          name: 'Food',
          color: '#FF5733',
          icon: 'utensils',
          amount: 150000,
          percentage: 42.86,
        },
      ],
      total: 350000,
    },
    paymentBreakdown: {
      data: [
        { method: 'pix', amount: 200000, percentage: 57.14 },
        { method: 'credit_card', amount: 150000, percentage: 42.86 },
      ],
      total: 350000,
    },
    creditCardBreakdown: {
      data: [
        {
          credit_card_id: 'card-001',
          name: 'Nubank',
          color: '#8A05BE',
          bank: 'nubank',
          flag: 'mastercard',
          amount: 150000,
          percentage: 100,
        },
      ],
      total: 150000,
    },
    savingsRate: {
      data: [{ month: '2026-01', rate: 30 }],
    },
    salaryTimeline: {
      data: [{ date: '2026-01-01', amount: 500000 }],
    },
    installmentForecast: {
      data: [{ month: '2026-02', total: 50000 }],
    },
    ...overrides,
  }
}

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getDashboard', () => {
    it('calls correct endpoint with required query params', async () => {
      const mockData = createMockDashboardData()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockData))

      const query: DashboardQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      }

      const result = await dashboardService.getDashboard(query)

      expect(api.get).toHaveBeenCalledWith('/dashboard?start_date=2026-01-01&end_date=2026-01-31')
      expect(result).toEqual({ data: mockData })
    })

    it('includes group_by param when provided', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(createMockDashboardData()))

      const query: DashboardQuery = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        group_by: 'week',
      }

      await dashboardService.getDashboard(query)

      expect(api.get).toHaveBeenCalledWith(
        '/dashboard?start_date=2026-01-01&end_date=2026-01-31&group_by=week'
      )
    })

    it('supports all group_by options', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(createMockDashboardData()))

      const groupByOptions = ['day', 'week', 'month'] as const

      for (const groupBy of groupByOptions) {
        await dashboardService.getDashboard({
          start_date: '2026-01-01',
          end_date: '2026-01-31',
          group_by: groupBy,
        })

        expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining(`group_by=${groupBy}`))
      }
    })

    it('returns complete dashboard data structure', async () => {
      const mockData = createMockDashboardData()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockData))

      const result = await dashboardService.getDashboard({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      })

      if ('data' in result) {
        expect(result.data.summary).toBeDefined()
        expect(result.data.expensesTimeline).toBeDefined()
        expect(result.data.incomeVsExpenses).toBeDefined()
        expect(result.data.categoryBreakdown).toBeDefined()
        expect(result.data.paymentBreakdown).toBeDefined()
        expect(result.data.creditCardBreakdown).toBeDefined()
        expect(result.data.savingsRate).toBeDefined()
        expect(result.data.salaryTimeline).toBeDefined()
        expect(result.data.installmentForecast).toBeDefined()
      }
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to fetch dashboard data')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await dashboardService.getDashboard({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when user not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await dashboardService.getDashboard({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      })

      expect(result).toEqual(errorResponse)
    })

    it('handles empty data arrays in response', async () => {
      const emptyData = createMockDashboardData({
        expensesTimeline: { data: [], group_by: 'day' },
        incomeVsExpenses: { data: [] },
        categoryBreakdown: { data: [], total: 0 },
        paymentBreakdown: { data: [], total: 0 },
        creditCardBreakdown: { data: [], total: 0 },
        savingsRate: { data: [] },
        salaryTimeline: { data: [] },
        installmentForecast: { data: [] },
      })
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(emptyData))

      const result = await dashboardService.getDashboard({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      })

      if ('data' in result) {
        expect(result.data.expensesTimeline.data).toHaveLength(0)
        expect(result.data.categoryBreakdown.data).toHaveLength(0)
        expect(result.data.categoryBreakdown.total).toBe(0)
      }
    })
  })
})
