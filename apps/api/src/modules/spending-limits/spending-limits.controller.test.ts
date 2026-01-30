import { type EffectiveSpendingLimit, HTTP_STATUS, type SpendingLimit } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import { spendingLimitsController } from './spending-limits.controller'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

vi.mock('./get-spending-limit.usecase')
vi.mock('./upsert-spending-limit.usecase')

type SuccessResponse<T> = { data: T }

const USER_ID = '33333333-3333-4333-8333-333333333333'

const baseSpendingLimit: SpendingLimit = {
  id: '44444444-4444-4444-8444-444444444444',
  user_id: USER_ID,
  year_month: '2024-02',
  amount_cents: 500000,
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
}

const effectiveLimit: EffectiveSpendingLimit = {
  year_month: '2024-02',
  amount_cents: 500000,
  is_carried_over: false,
  source_month: null,
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
  app.route('/spending-limits', spendingLimitsController)
  return app
}

describe('Spending Limits Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /spending-limits/:yearMonth', () => {
    it('returns spending limit for month', async () => {
      const mockExecute = vi.fn().mockResolvedValue(effectiveLimit)
      vi.mocked(GetSpendingLimitUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetSpendingLimitUseCase
      )

      const res = await app.request('/spending-limits/2024-02', { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<EffectiveSpendingLimit>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.year_month).toBe('2024-02')
      expect(body.data.amount_cents).toBe(500000)
    })

    it('returns carried-over limit when no explicit limit', async () => {
      const carriedOverLimit: EffectiveSpendingLimit = {
        year_month: '2024-03',
        amount_cents: 500000,
        is_carried_over: true,
        source_month: '2024-02',
      }
      const mockExecute = vi.fn().mockResolvedValue(carriedOverLimit)
      vi.mocked(GetSpendingLimitUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetSpendingLimitUseCase
      )

      const res = await app.request('/spending-limits/2024-03', { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<EffectiveSpendingLimit>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.is_carried_over).toBe(true)
      expect(body.data.source_month).toBe('2024-02')
    })

    it('returns null when no limit exists', async () => {
      const mockExecute = vi.fn().mockResolvedValue(null)
      vi.mocked(GetSpendingLimitUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetSpendingLimitUseCase
      )

      const res = await app.request('/spending-limits/2024-01', { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<null>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toBeNull()
    })

    it('returns validation error for invalid yearMonth format', async () => {
      const res = await app.request('/spending-limits/2024-1', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('POST /spending-limits', () => {
    it('creates spending limit', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseSpendingLimit)
      vi.mocked(UpsertSpendingLimitUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpsertSpendingLimitUseCase
      )

      const res = await app.request(
        '/spending-limits',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year_month: '2024-02',
            amount_cents: 500000,
          }),
        },
        testEnv
      )
      const body = (await res.json()) as SuccessResponse<SpendingLimit>

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      expect(body.data.year_month).toBe('2024-02')
    })

    it('returns validation error for invalid input', async () => {
      const res = await app.request(
        '/spending-limits',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year_month: '2024-02',
            amount_cents: -100,
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns validation error for missing year_month', async () => {
      const res = await app.request(
        '/spending-limits',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount_cents: 500000,
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })
})
