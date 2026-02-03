import { type DashboardData, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { dashboardController } from './dashboard.controller'
import { GetDashboardUseCase } from './get-dashboard.usecase'

vi.mock('./get-dashboard.usecase')
vi.mock('./get-summary.usecase')
vi.mock('./get-expenses-timeline.usecase')
vi.mock('./get-income-vs-expenses.usecase')
vi.mock('./get-category-breakdown.usecase')
vi.mock('./get-payment-breakdown.usecase')
vi.mock('./get-credit-card-breakdown.usecase')
vi.mock('./get-savings-rate.usecase')
vi.mock('./get-salary-timeline.usecase')
vi.mock('./get-installment-forecast.usecase')

type SuccessResponse<T> = { data: T }

const USER_ID = '33333333-3333-4333-8333-333333333333'

const baseDashboardData: DashboardData = {
  summary: {
    total_income: 500000,
    total_expenses: 300000,
    balance: 200000,
    savings_rate: 40,
    comparison: {
      income_change_percent: 5,
      expenses_change_percent: -2,
      balance_change_percent: 10,
    },
  },
  expensesTimeline: { data: [], group_by: 'day' },
  incomeVsExpenses: { data: [] },
  categoryBreakdown: { data: [], total: 0 },
  paymentBreakdown: { data: [], total: 0 },
  creditCardBreakdown: { data: [], total: 0 },
  savingsRate: { data: [] },
  salaryTimeline: { data: [] },
  installmentForecast: { data: [] },
}

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', USER_ID)
    c.set('accessToken', 'test-token')
    await next()
  })
  app.route('/dashboard', dashboardController)
  return app
}

describe('Dashboard Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /dashboard', () => {
    it('returns complete dashboard data', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseDashboardData)
      vi.mocked(GetDashboardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetDashboardUseCase
      )

      const res = await app.request(
        '/dashboard?start_date=2024-01-01&end_date=2024-01-31',
        { method: 'GET' },
        testEnv
      )
      const body = (await res.json()) as SuccessResponse<DashboardData>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toHaveProperty('summary')
      expect(body.data).toHaveProperty('expensesTimeline')
      expect(body.data).toHaveProperty('categoryBreakdown')
    })

    it('accepts group_by parameter', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseDashboardData)
      vi.mocked(GetDashboardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetDashboardUseCase
      )

      const res = await app.request(
        '/dashboard?start_date=2024-01-01&end_date=2024-01-31&group_by=month',
        { method: 'GET' },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it('returns 400 for missing start_date', async () => {
      const res = await app.request('/dashboard?end_date=2024-01-31', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for missing end_date', async () => {
      const res = await app.request('/dashboard?start_date=2024-01-01', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid date format', async () => {
      const res = await app.request(
        '/dashboard?start_date=01-01-2024&end_date=2024-01-31',
        { method: 'GET' },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid group_by value', async () => {
      const res = await app.request(
        '/dashboard?start_date=2024-01-01&end_date=2024-01-31&group_by=invalid',
        { method: 'GET' },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })
})
