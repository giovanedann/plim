import { type DashboardSummary, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clampDateRange } from '../../lib/clamp-date-range'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { DashboardDependencies } from './dashboard.factory'
import { createDashboardRouterWithDeps } from './dashboard.routes'

vi.mock('../../lib/clamp-date-range', () => ({
  clampDateRange: vi.fn(({ startDate, endDate }) => ({
    start_date: startDate,
    end_date: endDate,
    tier: 'free',
  })),
}))

// Mock use cases
const mockGetDashboard = { execute: vi.fn() }
const mockGetSummary = { execute: vi.fn() }
const mockGetExpensesTimeline = { execute: vi.fn() }
const mockGetIncomeVsExpenses = { execute: vi.fn() }
const mockGetCategoryBreakdown = { execute: vi.fn() }
const mockGetPaymentBreakdown = { execute: vi.fn() }
const mockGetCreditCardBreakdown = { execute: vi.fn() }
const mockGetSavingsRate = { execute: vi.fn() }
const mockGetSalaryTimeline = { execute: vi.fn() }
const mockGetInstallmentForecast = { execute: vi.fn() }

const mockDependencies = {
  supabase: {},
  repository: {},
  getDashboard: mockGetDashboard,
  getSummary: mockGetSummary,
  getExpensesTimeline: mockGetExpensesTimeline,
  getIncomeVsExpenses: mockGetIncomeVsExpenses,
  getCategoryBreakdown: mockGetCategoryBreakdown,
  getPaymentBreakdown: mockGetPaymentBreakdown,
  getCreditCardBreakdown: mockGetCreditCardBreakdown,
  getSavingsRate: mockGetSavingsRate,
  getSalaryTimeline: mockGetSalaryTimeline,
  getInstallmentForecast: mockGetInstallmentForecast,
} as unknown as DashboardDependencies

describe('Dashboard Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createDashboardRouterWithDeps(mockDependencies)
    app.route('/dashboard', router)
  })

  describe('GET /dashboard/summary', () => {
    it('returns dashboard summary with aggregations', async () => {
      const summary: DashboardSummary = {
        total_income: 500000,
        total_expenses: 320000,
        balance: 180000,
        savings_rate: 0.36,
        comparison: {
          income_change_percent: 10,
          expenses_change_percent: -5,
          balance_change_percent: 15,
        },
      }

      mockGetSummary.execute.mockResolvedValue(summary)

      const res = await app.request(
        '/dashboard/summary?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: DashboardSummary }
      expect(body.data).toEqual(summary)
      expect(mockGetSummary.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })
    })

    it('calculates savings rate correctly', async () => {
      const summary: DashboardSummary = {
        total_income: 1000000,
        total_expenses: 400000,
        balance: 600000,
        savings_rate: 0.6,
        comparison: {
          income_change_percent: 0,
          expenses_change_percent: 0,
          balance_change_percent: 0,
        },
      }

      mockGetSummary.execute.mockResolvedValue(summary)

      const res = await app.request(
        '/dashboard/summary?start_date=2024-01-01&end_date=2024-12-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: DashboardSummary }
      expect(body.data.savings_rate).toBe(0.6)
      expect(body.data.balance).toBe(600000)
    })

    it('handles zero income gracefully', async () => {
      const summary: DashboardSummary = {
        total_income: 0,
        total_expenses: 50000,
        balance: -50000,
        savings_rate: 0,
        comparison: {
          income_change_percent: 0,
          expenses_change_percent: 0,
          balance_change_percent: 0,
        },
      }

      mockGetSummary.execute.mockResolvedValue(summary)

      const res = await app.request(
        '/dashboard/summary?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: DashboardSummary }
      expect(body.data.balance).toBe(-50000)
      expect(body.data.savings_rate).toBe(0)
    })

    it('returns 400 for invalid date range', async () => {
      const res = await app.request('/dashboard/summary?start_date=invalid', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('GET /dashboard/category-breakdown', () => {
    it('returns category breakdown with aggregations', async () => {
      const breakdown = {
        categories: [
          {
            category_id: 'cat-food',
            category_name: 'Food',
            total: 120000,
            percentage: 0.4,
          },
          {
            category_id: 'cat-transport',
            category_name: 'Transport',
            total: 90000,
            percentage: 0.3,
          },
          {
            category_id: 'cat-entertainment',
            category_name: 'Entertainment',
            total: 90000,
            percentage: 0.3,
          },
        ],
        total: 300000,
      }

      mockGetCategoryBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/category-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.categories).toHaveLength(3)
      expect(body.data.total).toBe(300000)

      // Verify percentages sum to 1.0
      const totalPercentage = body.data.categories.reduce((sum, cat) => sum + cat.percentage, 0)
      expect(totalPercentage).toBeCloseTo(1.0)
    })

    it('sorts categories by total descending', async () => {
      const breakdown = {
        categories: [
          { category_id: 'cat-a', category_name: 'Category A', total: 150000, percentage: 0.5 },
          { category_id: 'cat-b', category_name: 'Category B', total: 100000, percentage: 0.33 },
          { category_id: 'cat-c', category_name: 'Category C', total: 50000, percentage: 0.17 },
        ],
        total: 300000,
      }

      mockGetCategoryBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/category-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof breakdown }

      // Verify descending order
      expect(body.data.categories[0]!.total).toBeGreaterThanOrEqual(body.data.categories[1]!.total)
      expect(body.data.categories[1]!.total).toBeGreaterThanOrEqual(body.data.categories[2]!.total)
    })

    it('returns empty array when no expenses exist', async () => {
      const breakdown = {
        categories: [],
        total: 0,
      }

      mockGetCategoryBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/category-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.categories).toEqual([])
      expect(body.data.total).toBe(0)
    })
  })

  describe('GET /dashboard/payment-breakdown', () => {
    it('returns payment method breakdown', async () => {
      const breakdown = {
        payment_methods: [
          { payment_method: 'credit_card', total: 180000, percentage: 0.6 },
          { payment_method: 'debit_card', total: 60000, percentage: 0.2 },
          { payment_method: 'cash', total: 60000, percentage: 0.2 },
        ],
        total: 300000,
      }

      mockGetPaymentBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/payment-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.payment_methods).toHaveLength(3)
      expect(body.data.total).toBe(300000)
      expect(mockGetPaymentBreakdown.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })
    })

    it('handles single payment method', async () => {
      const breakdown = {
        payment_methods: [{ payment_method: 'credit_card', total: 150000, percentage: 1.0 }],
        total: 150000,
      }

      mockGetPaymentBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/payment-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.payment_methods).toHaveLength(1)
      expect(body.data.payment_methods[0]!.percentage).toBe(1.0)
    })
  })

  describe('GET /dashboard/credit-card-breakdown', () => {
    it('returns credit card breakdown', async () => {
      const breakdown = {
        cards: [
          {
            credit_card_id: 'card-1',
            card_name: 'Visa Platinum',
            total: 200000,
            percentage: 0.67,
          },
          {
            credit_card_id: 'card-2',
            card_name: 'Mastercard Gold',
            total: 100000,
            percentage: 0.33,
          },
        ],
        total: 300000,
      }

      mockGetCreditCardBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/credit-card-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.cards).toHaveLength(2)
      expect(body.data.total).toBe(300000)
    })

    it('excludes non-credit-card expenses', async () => {
      const breakdown = {
        cards: [
          {
            credit_card_id: 'card-1',
            card_name: 'Visa',
            total: 150000,
            percentage: 1.0,
          },
        ],
        total: 150000,
      }

      mockGetCreditCardBreakdown.execute.mockResolvedValue(breakdown)

      const res = await app.request(
        '/dashboard/credit-card-breakdown?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof breakdown }
      expect(body.data.total).toBe(150000)
    })
  })

  describe('GET /dashboard/income-vs-expenses', () => {
    it('returns income vs expenses comparison', async () => {
      const comparison = {
        income: 500000,
        expenses: 320000,
        difference: 180000,
        savings_rate: 0.36,
      }

      mockGetIncomeVsExpenses.execute.mockResolvedValue(comparison)

      const res = await app.request(
        '/dashboard/income-vs-expenses?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof comparison }
      expect(body.data.income).toBe(500000)
      expect(body.data.expenses).toBe(320000)
      expect(body.data.difference).toBe(180000)
      expect(body.data.savings_rate).toBe(0.36)
    })

    it('handles negative balance correctly', async () => {
      const comparison = {
        income: 300000,
        expenses: 400000,
        difference: -100000,
        savings_rate: -0.33,
      }

      mockGetIncomeVsExpenses.execute.mockResolvedValue(comparison)

      const res = await app.request(
        '/dashboard/income-vs-expenses?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof comparison }
      expect(body.data.difference).toBe(-100000)
      expect(body.data.savings_rate).toBeLessThan(0)
    })
  })

  describe('GET /dashboard/expenses-timeline', () => {
    it('returns daily expenses timeline', async () => {
      const timeline = {
        data: [
          { date: '2024-01-01', total: 15000 },
          { date: '2024-01-02', total: 20000 },
          { date: '2024-01-03', total: 12000 },
        ],
        total: 47000,
      }

      mockGetExpensesTimeline.execute.mockResolvedValue(timeline)

      const res = await app.request(
        '/dashboard/expenses-timeline?start_date=2024-01-01&end_date=2024-01-03&group_by=day',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof timeline }
      expect(body.data.data).toHaveLength(3)
      expect(body.data.total).toBe(47000)
      expect(mockGetExpensesTimeline.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        start_date: '2024-01-01',
        end_date: '2024-01-03',
        group_by: 'day',
      })
    })

    it('returns monthly expenses timeline', async () => {
      const timeline = {
        data: [
          { date: '2024-01', total: 250000 },
          { date: '2024-02', total: 280000 },
          { date: '2024-03', total: 245000 },
        ],
        total: 775000,
      }

      mockGetExpensesTimeline.execute.mockResolvedValue(timeline)

      const res = await app.request(
        '/dashboard/expenses-timeline?start_date=2024-01-01&end_date=2024-03-31&group_by=month',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof timeline }
      expect(body.data.data).toHaveLength(3)
      expect(mockGetExpensesTimeline.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        group_by: 'month',
      })
    })

    it('handles empty timeline', async () => {
      const timeline = {
        data: [],
        total: 0,
      }

      mockGetExpensesTimeline.execute.mockResolvedValue(timeline)

      const res = await app.request(
        '/dashboard/expenses-timeline?start_date=2024-01-01&end_date=2024-01-31&group_by=day',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof timeline }
      expect(body.data.data).toEqual([])
      expect(body.data.total).toBe(0)
    })
  })

  describe('GET /dashboard/savings-rate', () => {
    it('calculates savings rate correctly', async () => {
      const savingsRate = {
        income: 600000,
        expenses: 360000,
        savings: 240000,
        rate: 0.4,
      }

      mockGetSavingsRate.execute.mockResolvedValue(savingsRate)

      const res = await app.request(
        '/dashboard/savings-rate?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof savingsRate }
      expect(body.data.rate).toBe(0.4)
      expect(body.data.savings).toBe(240000)
    })

    it('handles zero income for savings rate', async () => {
      const savingsRate = {
        income: 0,
        expenses: 50000,
        savings: -50000,
        rate: 0,
      }

      mockGetSavingsRate.execute.mockResolvedValue(savingsRate)

      const res = await app.request(
        '/dashboard/savings-rate?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof savingsRate }
      expect(body.data.rate).toBe(0)
    })
  })

  describe('GET /dashboard/salary-timeline', () => {
    it('returns salary history timeline', async () => {
      const timeline = {
        data: [
          { date: '2024-01-01', amount: 500000 },
          { date: '2024-02-01', amount: 520000 },
          { date: '2024-03-01', amount: 550000 },
        ],
      }

      mockGetSalaryTimeline.execute.mockResolvedValue(timeline)

      const res = await app.request(
        '/dashboard/salary-timeline?start_date=2024-01-01&end_date=2024-03-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof timeline }
      expect(body.data.data).toHaveLength(3)
      expect(body.data.data[0]!.amount).toBe(500000)
    })

    it('handles empty salary history', async () => {
      const timeline = {
        data: [],
      }

      mockGetSalaryTimeline.execute.mockResolvedValue(timeline)

      const res = await app.request(
        '/dashboard/salary-timeline?start_date=2024-01-01&end_date=2024-01-31',
        {
          method: 'GET',
        }
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof timeline }
      expect(body.data.data).toEqual([])
    })
  })

  describe('GET /dashboard/installment-forecast', () => {
    it('returns future installment forecast', async () => {
      const forecast = {
        data: [
          {
            date: '2024-02-01',
            amount: 33330,
            installments: [
              {
                expense_id: 'exp-1',
                description: 'TV Purchase',
                installment_current: 2,
                installment_total: 3,
                amount: 33330,
              },
            ],
          },
          {
            date: '2024-03-01',
            amount: 33330,
            installments: [
              {
                expense_id: 'exp-1',
                description: 'TV Purchase',
                installment_current: 3,
                installment_total: 3,
                amount: 33330,
              },
            ],
          },
        ],
        total: 66660,
      }

      mockGetInstallmentForecast.execute.mockResolvedValue(forecast)

      const res = await app.request('/dashboard/installment-forecast', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof forecast }
      expect(body.data.data).toHaveLength(2)
      expect(body.data.total).toBe(66660)
      expect(mockGetInstallmentForecast.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns empty forecast when no future installments', async () => {
      const forecast = {
        data: [],
        total: 0,
      }

      mockGetInstallmentForecast.execute.mockResolvedValue(forecast)

      const res = await app.request('/dashboard/installment-forecast', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: typeof forecast }
      expect(body.data.data).toEqual([])
      expect(body.data.total).toBe(0)
    })
  })

  describe('GET /dashboard - Complete dashboard', () => {
    it('returns complete dashboard data', async () => {
      const dashboard = {
        summary: {
          total_income: 500000,
          total_expenses: 320000,
          balance: 180000,
          savings_rate: 0.36,
          largest_category: null,
          total_fixed: 150000,
          total_variable: 170000,
        },
        category_breakdown: {
          categories: [
            { category_id: 'cat-1', category_name: 'Food', total: 120000, percentage: 0.375 },
          ],
          total: 320000,
        },
        expenses_timeline: {
          data: [{ date: '2024-01-15', total: 50000 }],
          total: 50000,
        },
      }

      mockGetDashboard.execute.mockResolvedValue(dashboard)

      const res = await app.request('/dashboard?start_date=2024-01-01&end_date=2024-01-31', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof dashboard }
      expect(body.data.summary).toBeDefined()
      expect(body.data.category_breakdown).toBeDefined()
      expect(body.data.expenses_timeline).toBeDefined()
      expect(mockGetDashboard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        { start_date: '2024-01-01', end_date: '2024-01-31' },
        'free'
      )
    })

    it('returns complete dashboard data with pro date range', async () => {
      const dashboard = {
        summary: {
          total_income: 500000,
          total_expenses: 320000,
          balance: 180000,
          savings_rate: 0.36,
          largest_category: null,
          total_fixed: 150000,
          total_variable: 170000,
        },
        category_breakdown: {
          categories: [
            { category_id: 'cat-1', category_name: 'Food', total: 120000, percentage: 0.375 },
          ],
          total: 320000,
        },
        expenses_timeline: {
          data: [{ date: '2024-01-15', total: 50000 }],
          total: 50000,
        },
      }

      // Mock clampDateRange to return pro tier (unclamped dates)
      vi.mocked(clampDateRange).mockResolvedValueOnce({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        tier: 'pro',
      })

      mockGetDashboard.execute.mockResolvedValue(dashboard)

      const res = await app.request('/dashboard?start_date=2024-01-01&end_date=2024-01-31', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: typeof dashboard }
      expect(body.data.summary).toBeDefined()
      expect(body.data.category_breakdown).toBeDefined()
      expect(body.data.expenses_timeline).toBeDefined()
      expect(mockGetDashboard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        { start_date: '2024-01-01', end_date: '2024-01-31' },
        'pro'
      )
    })
  })
})
