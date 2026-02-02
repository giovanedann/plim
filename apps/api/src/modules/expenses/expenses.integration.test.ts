import { HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TEST_ENV,
  TEST_USER_ID,
  createIntegrationApp,
  createMockExpense,
  createMockSupabaseClient,
  resetIdCounter,
} from '../../test-utils/api-integration'
import { expensesController } from './expenses.controller'

// Mock the Supabase client creation
vi.mock('../../lib/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/env')>()
  return {
    ...actual,
    createSupabaseClientWithAuth: vi.fn(),
  }
})

import { createSupabaseClientWithAuth } from '../../lib/env'

describe('Expenses Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    mockSupabase = createMockSupabaseClient()

    // Mock the Supabase client creation to return our mock
    vi.mocked(createSupabaseClientWithAuth).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createSupabaseClientWithAuth>
    )

    app = createIntegrationApp(TEST_USER_ID)
    app.route('/expenses', expensesController)
  })

  describe('POST /expenses - One-time expense', () => {
    it('creates single expense with valid input', async () => {
      const expense = createMockExpense({
        type: 'one_time',
        amount_cents: 5000,
        description: 'Grocery shopping',
      })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: expense, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'one_time',
          category_id: expense.category_id,
          description: expense.description,
          amount_cents: expense.amount_cents,
          payment_method: expense.payment_method,
          date: expense.date,
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = await res.json()
      expect(body).toEqual({ data: expense })
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: TEST_USER_ID,
          description: 'Grocery shopping',
          amount_cents: 5000,
          is_recurrent: false,
        })
      )
    })

    it('creates expense with credit card', async () => {
      const expense = createMockExpense({
        type: 'one_time',
        payment_method: 'credit_card',
        credit_card_id: 'card-123',
      })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: expense, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'one_time',
          category_id: expense.category_id,
          description: expense.description,
          amount_cents: expense.amount_cents,
          payment_method: 'credit_card',
          credit_card_id: 'card-123',
          date: expense.date,
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'credit_card',
          credit_card_id: 'card-123',
        })
      )
    })

    it('returns 400 for invalid input', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'one_time',
          // Missing required fields
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('POST /expenses - Installment expense', () => {
    it('creates installment expenses with amount distribution', async () => {
      const installments = [
        createMockExpense({
          installment_current: 1,
          installment_total: 3,
          installment_group_id: 'group-123',
          amount_cents: 3334,
        }),
        createMockExpense({
          installment_current: 2,
          installment_total: 3,
          installment_group_id: 'group-123',
          amount_cents: 3333,
        }),
        createMockExpense({
          installment_current: 3,
          installment_total: 3,
          installment_group_id: 'group-123',
          amount_cents: 3333,
        }),
      ]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockResolvedValue({ data: installments, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          category_id: installments[0].category_id,
          description: 'TV Purchase',
          amount_cents: 10000,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_total: 3,
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = await res.json()
      expect(body.data).toHaveLength(3)

      // Verify amount distribution
      const totalAmount = body.data.reduce(
        (sum: number, exp: { amount_cents: number }) => sum + exp.amount_cents,
        0
      )
      expect(totalAmount).toBe(10000)

      // Verify installment metadata
      expect(body.data[0].installment_current).toBe(1)
      expect(body.data[1].installment_current).toBe(2)
      expect(body.data[2].installment_current).toBe(3)
      expect(
        body.data.every((exp: { installment_total: number }) => exp.installment_total === 3)
      ).toBe(true)
    })

    it('generates unique group ID for installments', async () => {
      const installments = [
        createMockExpense({ installment_group_id: 'group-abc' }),
        createMockExpense({ installment_group_id: 'group-abc' }),
      ]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockResolvedValue({ data: installments, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          category_id: installments[0].category_id,
          description: 'Test',
          amount_cents: 1000,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_total: 2,
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = await res.json()
      const groupId = body.data[0].installment_group_id
      expect(groupId).toBeTruthy()
      expect(
        body.data.every(
          (exp: { installment_group_id: string }) => exp.installment_group_id === groupId
        )
      ).toBe(true)
    })
  })

  describe('POST /expenses - Recurrent expense', () => {
    it('creates recurrent expense with schedule', async () => {
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: null,
      })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: expense, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recurrent',
          category_id: expense.category_id,
          description: 'Monthly subscription',
          amount_cents: 2999,
          payment_method: 'credit_card',
          recurrence_day: 15,
          recurrence_start: '2024-01-15',
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = await res.json()
      expect(body.data.is_recurrent).toBe(true)
      expect(body.data.recurrence_day).toBe(15)
      expect(body.data.recurrence_start).toBe('2024-01-15')
    })

    it('creates recurrent expense with end date', async () => {
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_end: '2024-12-31',
      })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.insert.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: expense, error: null })

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recurrent',
          category_id: expense.category_id,
          description: 'Temporary subscription',
          amount_cents: 1999,
          payment_method: 'debit_card',
          recurrence_day: 1,
          recurrence_start: '2024-01-01',
          recurrence_end: '2024-12-31',
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = await res.json()
      expect(body.data.recurrence_end).toBe('2024-12-31')
    })
  })

  describe('GET /expenses - List with filters', () => {
    it('lists all expenses for user', async () => {
      const expenses = [createMockExpense(), createMockExpense(), createMockExpense()]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = await res.json()
      expect(body.data).toHaveLength(3)
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })

    it('filters by date range', async () => {
      const expenses = [createMockExpense({ date: '2024-01-15' })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.gte.mockReturnValue(mockQuery)
      mockQuery.lte.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?start_date=2024-01-01&end_date=2024-01-31', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2024-01-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2024-01-31')
    })

    it('filters by category', async () => {
      const expenses = [createMockExpense({ category_id: 'cat-123' })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?category_id=cat-123', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat-123')
    })

    it('filters by payment method', async () => {
      const expenses = [createMockExpense({ payment_method: 'credit_card' })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?payment_method=credit_card', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.eq).toHaveBeenCalledWith('payment_method', 'credit_card')
    })

    it('filters by expense type - one_time', async () => {
      const expenses = [createMockExpense({ is_recurrent: false, installment_total: null })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.is.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?expense_type=one_time', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_recurrent', false)
      expect(mockQuery.is).toHaveBeenCalledWith('installment_total', null)
    })

    it('filters by expense type - recurrent', async () => {
      const expenses = [createMockExpense({ is_recurrent: true })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?expense_type=recurrent', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_recurrent', true)
    })

    it('filters by expense type - installment', async () => {
      const expenses = [createMockExpense({ installment_total: 3 })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.not.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?expense_type=installment', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.not).toHaveBeenCalledWith('installment_total', 'is', null)
    })

    it('filters by credit card', async () => {
      const expenses = [createMockExpense({ credit_card_id: 'card-123' })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?credit_card_id=card-123', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.eq).toHaveBeenCalledWith('credit_card_id', 'card-123')
    })

    it('filters for expenses without credit card', async () => {
      const expenses = [createMockExpense({ credit_card_id: null })]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.is.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: expenses, error: null })

      const res = await app.request('/expenses?credit_card_id=none', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.is).toHaveBeenCalledWith('credit_card_id', null)
    })

    it('returns empty array when no expenses exist', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: [], error: null })

      const res = await app.request('/expenses', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = await res.json()
      expect(body.data).toEqual([])
    })
  })

  describe('GET /expenses/paginated', () => {
    it('returns paginated expenses with metadata', async () => {
      const expenses = Array.from({ length: 10 }, () => createMockExpense())

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue({ data: expenses, error: null, count: 25 })

      const res = await app.request('/expenses/paginated?page=1&limit=10', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = await res.json()
      expect(body.data).toHaveLength(10)
      expect(body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        total_pages: 3,
      })
    })

    it('handles pagination for second page', async () => {
      const expenses = Array.from({ length: 10 }, () => createMockExpense())

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockReturnValue(mockQuery)
      mockQuery.range.mockResolvedValue({ data: expenses, error: null, count: 25 })

      const res = await app.request('/expenses/paginated?page=2&limit=10', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19)
    })
  })

  describe('GET /expenses/:id', () => {
    it('returns expense by ID', async () => {
      const expense = createMockExpense({ id: 'exp-123' })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: expense, error: null })

      const res = await app.request('/expenses/exp-123', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = await res.json()
      expect(body.data.id).toBe('exp-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'exp-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })

    it('returns 404 when expense not found', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } as unknown as Error,
      })

      const res = await app.request('/expenses/nonexistent', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } as unknown as Error,
      })

      const _res = await app.request('/expenses/exp-123', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })
  })

  describe('PATCH /expenses/:id', () => {
    it('updates expense with valid data', async () => {
      const updatedExpense = createMockExpense({
        id: 'exp-123',
        description: 'Updated description',
        amount_cents: 7500,
      })

      const mockQuery = mockSupabase.from('expense')
      mockQuery.update.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: updatedExpense, error: null })

      const res = await app.request('/expenses/exp-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Updated description',
          amount_cents: 7500,
        }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = await res.json()
      expect(body.data.description).toBe('Updated description')
      expect(body.data.amount_cents).toBe(7500)
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Updated description',
          amount_cents: 7500,
        })
      )
    })

    it('returns 404 when updating nonexistent expense', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.update.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } as unknown as Error,
      })

      const res = await app.request('/expenses/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership on update', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.update.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.single.mockResolvedValue({ data: null, error: null })

      await app.request('/expenses/exp-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
        env: TEST_ENV,
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })
  })

  describe('DELETE /expenses/:id', () => {
    it('deletes expense successfully', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.delete.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.eq.mockResolvedValue({ error: null, count: 1 })

      const res = await app.request('/expenses/exp-123', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'exp-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })

    it('returns 404 when deleting nonexistent expense', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.delete.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.eq.mockResolvedValue({ error: null, count: 0 })

      const res = await app.request('/expenses/nonexistent', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership on delete', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.delete.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.eq.mockResolvedValue({ error: null, count: 1 })

      await app.request('/expenses/exp-123', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })
  })

  describe('GET /expenses/installments/:groupId', () => {
    it('returns all installments in group', async () => {
      const installments = [
        createMockExpense({
          installment_group_id: 'group-123',
          installment_current: 1,
          installment_total: 3,
        }),
        createMockExpense({
          installment_group_id: 'group-123',
          installment_current: 2,
          installment_total: 3,
        }),
        createMockExpense({
          installment_group_id: 'group-123',
          installment_current: 3,
          installment_total: 3,
        }),
      ]

      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: installments, error: null })

      const res = await app.request('/expenses/installments/group-123', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = await res.json()
      expect(body.data).toHaveLength(3)
      expect(body.data[0].installment_current).toBe(1)
      expect(body.data[1].installment_current).toBe(2)
      expect(body.data[2].installment_current).toBe(3)
      expect(mockQuery.eq).toHaveBeenCalledWith('installment_group_id', 'group-123')
    })

    it('returns 404 for nonexistent group', async () => {
      const mockQuery = mockSupabase.from('expense')
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: [], error: null })

      const res = await app.request('/expenses/installments/nonexistent', {
        method: 'GET',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })

  describe('DELETE /expenses/installments/:groupId', () => {
    it('deletes all installments in group', async () => {
      const installments = [createMockExpense({ installment_group_id: 'group-123' })]

      const mockQuery = mockSupabase.from('expense')
      // First call: findByGroupId
      mockQuery.select.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockReturnValueOnce(mockQuery)
      mockQuery.order.mockResolvedValueOnce({ data: installments, error: null })

      // Second call: deleteByGroupId
      mockQuery.delete.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockResolvedValueOnce({ error: null, count: 3 })

      const res = await app.request('/expenses/installments/group-123', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('returns 404 when deleting nonexistent group', async () => {
      const mockQuery = mockSupabase.from('expense')
      // findByGroupId returns empty
      mockQuery.select.mockReturnValue(mockQuery)
      mockQuery.eq.mockReturnValue(mockQuery)
      mockQuery.order.mockResolvedValue({ data: [], error: null })

      const res = await app.request('/expenses/installments/nonexistent', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership when deleting group', async () => {
      const installments = [createMockExpense({ installment_group_id: 'group-123' })]

      const mockQuery = mockSupabase.from('expense')
      // First call: findByGroupId
      mockQuery.select.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockReturnValueOnce(mockQuery)
      mockQuery.order.mockResolvedValueOnce({ data: installments, error: null })

      // Second call: deleteByGroupId
      mockQuery.delete.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockReturnValueOnce(mockQuery)
      mockQuery.eq.mockResolvedValueOnce({ error: null, count: 3 })

      await app.request('/expenses/installments/group-123', {
        method: 'DELETE',
        env: TEST_ENV,
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
    })
  })
})
