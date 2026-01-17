import { HTTP_STATUS, type SalaryHistory } from '@myfinances/shared'
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

const USER_ID = '22222222-2222-2222-2222-222222222222'
const SALARY_ID = '11111111-1111-1111-1111-111111111111'

const baseSalary: SalaryHistory = {
  id: SALARY_ID,
  user_id: USER_ID,
  amount_cents: 500000,
  effective_from: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
}

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
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
      const mockExecute = vi.fn().mockResolvedValue(baseSalary)
      vi.mocked(GetSalaryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetSalaryUseCase
      )

      const res = await app.request('/salary?month=2024-03', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory>
      expect(json.data).toEqual(baseSalary)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, '2024-03')
    })

    it('returns null when no salary exists', async () => {
      const mockExecute = vi.fn().mockResolvedValue(null)
      vi.mocked(GetSalaryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetSalaryUseCase
      )

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
  })

  describe('GET /salary/history', () => {
    it('returns salary history', async () => {
      const history = [
        baseSalary,
        { ...baseSalary, id: '33333333-3333-3333-3333-333333333333', amount_cents: 400000 },
      ]
      const mockExecute = vi.fn().mockResolvedValue(history)
      vi.mocked(ListSalaryHistoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListSalaryHistoryUseCase
      )

      const res = await app.request('/salary/history', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory[]>
      expect(json.data).toHaveLength(2)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID)
    })

    it('returns empty array when no history', async () => {
      const mockExecute = vi.fn().mockResolvedValue([])
      vi.mocked(ListSalaryHistoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListSalaryHistoryUseCase
      )

      const res = await app.request('/salary/history', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<SalaryHistory[]>
      expect(json.data).toEqual([])
    })
  })

  describe('POST /salary', () => {
    it('creates salary record', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseSalary)
      vi.mocked(CreateSalaryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateSalaryUseCase
      )

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
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, {
        amount_cents: 500000,
        effective_from: '2024-01-01',
      })
    })

    it('returns 400 for invalid data', async () => {
      const res = await app.request(
        '/salary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: -100 }),
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
  })
})
