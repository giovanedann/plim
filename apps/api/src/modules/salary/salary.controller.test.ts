import { HTTP_STATUS, type SalaryHistory, createMockSalaryHistory } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { CreateSalaryUseCase } from './create-salary.usecase'
import { GetSalaryUseCase } from './get-salary.usecase'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import { salaryController } from './salary.controller'

vi.mock('./get-salary.usecase')
vi.mock('./create-salary.usecase')
vi.mock('./list-salary-history.usecase')

type SuccessResponse<T> = { data: T }

const USER_ID = '22222222-2222-4222-8222-222222222222'

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
  app.route('/salary', salaryController)
  return app
}

describe('Salary Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /salary', () => {
    it('returns active salary for month', async () => {
      const salary = createMockSalaryHistory({ user_id: USER_ID })
      const mockExecute = vi.fn().mockResolvedValue(salary)
      vi.mocked(GetSalaryUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as GetSalaryUseCase
      })

      const res = await app.request('/salary?month=2024-03', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory>
      expect(json.data.user_id).toBe(USER_ID)
      expect(json.data.amount_cents).toBeGreaterThan(0)
    })

    it('returns null when no salary exists', async () => {
      const mockExecute = vi.fn().mockResolvedValue(null)
      vi.mocked(GetSalaryUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as GetSalaryUseCase
      })

      const res = await app.request('/salary?month=2024-01', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory | null>
      expect(json.data).toBeNull()
    })

    it('returns 400 for invalid month format', async () => {
      const res = await app.request('/salary?month=invalid', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 when month is missing', async () => {
      const res = await app.request('/salary', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for malformed month (wrong separator)', async () => {
      const res = await app.request('/salary?month=2024/03', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('GET /salary/history', () => {
    it('returns salary history', async () => {
      const history = [
        createMockSalaryHistory({ user_id: USER_ID, amount_cents: 500000 }),
        createMockSalaryHistory({ user_id: USER_ID, amount_cents: 400000 }),
      ]
      const mockExecute = vi.fn().mockResolvedValue(history)
      vi.mocked(ListSalaryHistoryUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as ListSalaryHistoryUseCase
      })

      const res = await app.request('/salary/history', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory[]>
      expect(json.data).toHaveLength(2)
    })

    it('returns empty array when no history', async () => {
      const mockExecute = vi.fn().mockResolvedValue([])
      vi.mocked(ListSalaryHistoryUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as ListSalaryHistoryUseCase
      })

      const res = await app.request('/salary/history', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory[]>
      expect(json.data).toEqual([])
    })
  })

  describe('POST /salary', () => {
    it('creates salary record', async () => {
      const salary = createMockSalaryHistory({
        user_id: USER_ID,
        amount_cents: 500000,
        effective_from: '2024-01-01',
      })
      const mockExecute = vi.fn().mockResolvedValue(salary)
      vi.mocked(CreateSalaryUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as CreateSalaryUseCase
      })

      const res = await app.request(
        '/salary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 500000, effective_from: '2024-01-01' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = (await res.json()) as SuccessResponse<SalaryHistory>
      expect(json.data.amount_cents).toBe(500000)
    })

    it('returns 400 for negative amount', async () => {
      const res = await app.request(
        '/salary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: -100, effective_from: '2024-01-01' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for missing effective_from', async () => {
      const res = await app.request(
        '/salary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 500000 }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid effective_from format', async () => {
      const res = await app.request(
        '/salary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 500000, effective_from: '01-01-2024' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })
})
