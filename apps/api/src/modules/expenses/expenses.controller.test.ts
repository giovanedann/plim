import { type ApiError, ERROR_CODES, type Expense, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { CreateExpenseUseCase } from './create-expense.usecase'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
import { expensesController } from './expenses.controller'
import { GetExpenseUseCase } from './get-expense.usecase'
import { ListExpensesUseCase, type ProjectedExpense } from './list-expenses.usecase'
import { UpdateExpenseUseCase } from './update-expense.usecase'

vi.mock('./list-expenses.usecase')
vi.mock('./get-expense.usecase')
vi.mock('./create-expense.usecase')
vi.mock('./update-expense.usecase')
vi.mock('./delete-expense.usecase')

type SuccessResponse<T> = { data: T }
type ErrorResponse = { error: ApiError }

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111'
const EXPENSE_ID = '22222222-2222-4222-8222-222222222222'
const USER_ID = '33333333-3333-4333-8333-333333333333'

const baseExpense: Expense = {
  id: EXPENSE_ID,
  user_id: USER_ID,
  category_id: CATEGORY_ID,
  description: 'Test Expense',
  amount_cents: 5000,
  payment_method: 'credit_card',
  date: '2024-01-15',
  is_recurrent: false,
  recurrence_day: null,
  recurrence_start: null,
  recurrence_end: null,
  installment_current: null,
  installment_total: null,
  installment_group_id: null,
  credit_card_id: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
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
  app.route('/expenses', expensesController)
  return app
}

describe('Expenses Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /expenses', () => {
    it('returns list of expenses', async () => {
      const projectedExpense: ProjectedExpense = { ...baseExpense, is_projected: false }
      const mockExecute = vi.fn().mockResolvedValue([projectedExpense])
      vi.mocked(ListExpensesUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListExpensesUseCase
      )

      const res = await app.request('/expenses', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<ProjectedExpense[]>
      expect(json.data).toHaveLength(1)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, {})
    })

    it('passes filters to use case', async () => {
      const mockExecute = vi.fn().mockResolvedValue([])
      vi.mocked(ListExpensesUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListExpensesUseCase
      )

      const res = await app.request(
        `/expenses?start_date=2024-01-01&end_date=2024-01-31&category_id=${CATEGORY_ID}`,
        { method: 'GET' },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        category_id: CATEGORY_ID,
      })
    })

    it('returns 400 for invalid date format', async () => {
      const res = await app.request('/expenses?start_date=invalid-date', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('GET /expenses/:id', () => {
    it('returns single expense', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseExpense)
      vi.mocked(GetExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetExpenseUseCase
      )

      const res = await app.request(`/expenses/${EXPENSE_ID}`, { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Expense>
      expect(json.data.id).toBe(EXPENSE_ID)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, EXPENSE_ID)
    })

    it('returns 404 when expense not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(GetExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetExpenseUseCase
      )

      const res = await app.request('/expenses/not-found', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      const json = (await res.json()) as ErrorResponse
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })
  })

  describe('POST /expenses', () => {
    it('creates one-time expense', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseExpense)
      vi.mocked(CreateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateExpenseUseCase
      )

      const res = await app.request(
        '/expenses',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'one_time',
            category_id: CATEGORY_ID,
            description: 'Test Expense',
            amount_cents: 5000,
            payment_method: 'credit_card',
            date: '2024-01-15',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = (await res.json()) as SuccessResponse<Expense>
      expect(json.data.id).toBe(EXPENSE_ID)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, {
        type: 'one_time',
        category_id: CATEGORY_ID,
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
      })
    })

    it('creates recurrent expense', async () => {
      const recurrentExpense = {
        ...baseExpense,
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
      }
      const mockExecute = vi.fn().mockResolvedValue(recurrentExpense)
      vi.mocked(CreateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateExpenseUseCase
      )

      const res = await app.request(
        '/expenses',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'recurrent',
            category_id: CATEGORY_ID,
            description: 'Test Expense',
            amount_cents: 5000,
            payment_method: 'credit_card',
            recurrence_day: 15,
            recurrence_start: '2024-01-15',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = (await res.json()) as SuccessResponse<Expense>
      expect(json.data.is_recurrent).toBe(true)
    })

    it('creates installment expenses', async () => {
      const installments = [
        {
          ...baseExpense,
          id: '44444444-4444-4444-4444-444444444441',
          installment_current: 1,
          installment_total: 3,
        },
        {
          ...baseExpense,
          id: '44444444-4444-4444-4444-444444444442',
          installment_current: 2,
          installment_total: 3,
        },
        {
          ...baseExpense,
          id: '44444444-4444-4444-4444-444444444443',
          installment_current: 3,
          installment_total: 3,
        },
      ]
      const mockExecute = vi.fn().mockResolvedValue(installments)
      vi.mocked(CreateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateExpenseUseCase
      )

      const res = await app.request(
        '/expenses',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'installment',
            category_id: CATEGORY_ID,
            description: 'Test Expense',
            amount_cents: 5000,
            payment_method: 'credit_card',
            date: '2024-01-15',
            installment_total: 3,
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = (await res.json()) as SuccessResponse<Expense[]>
      expect(json.data).toHaveLength(3)
    })

    it('returns 400 for invalid data', async () => {
      const res = await app.request(
        '/expenses',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'one_time', description: '' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid payment method', async () => {
      const res = await app.request(
        '/expenses',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'one_time',
            category_id: CATEGORY_ID,
            description: 'Test',
            amount_cents: 5000,
            payment_method: 'invalid_method',
            date: '2024-01-15',
          }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('PATCH /expenses/:id', () => {
    it('updates expense', async () => {
      const updatedExpense = { ...baseExpense, description: 'Updated' }
      const mockExecute = vi.fn().mockResolvedValue(updatedExpense)
      vi.mocked(UpdateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateExpenseUseCase
      )

      const res = await app.request(
        `/expenses/${EXPENSE_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Updated' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Expense>
      expect(json.data.description).toBe('Updated')
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, EXPENSE_ID, {
        description: 'Updated',
      })
    })

    it('returns 404 when expense not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(UpdateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateExpenseUseCase
      )

      const res = await app.request(
        '/expenses/not-found',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Updated' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('returns 403 when updating recurrent expense', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.FORBIDDEN,
            'Cannot update recurrent expense directly',
            HTTP_STATUS.FORBIDDEN
          )
        )
      vi.mocked(UpdateExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateExpenseUseCase
      )

      const res = await app.request(
        '/expenses/recurrent-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Updated' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      const json = (await res.json()) as ErrorResponse
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN)
    })
  })

  describe('DELETE /expenses/:id', () => {
    it('deletes expense', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteExpenseUseCase
      )

      const res = await app.request(`/expenses/${EXPENSE_ID}`, { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockExecute).toHaveBeenCalledWith(USER_ID, EXPENSE_ID)
    })

    it('returns 404 when expense not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(DeleteExpenseUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteExpenseUseCase
      )

      const res = await app.request('/expenses/not-found', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
