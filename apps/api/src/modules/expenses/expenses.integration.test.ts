import {
  ERROR_CODES,
  type Expense,
  HTTP_STATUS,
  createMockExpense,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { ExpensesDependencies } from './expenses.factory'
import { createExpensesRouterWithDeps } from './expenses.routes'

// Mock use cases
const mockListExpenses = {
  execute: vi.fn(),
  executePaginated: vi.fn(),
}
const mockGetExpense = { execute: vi.fn() }
const mockCreateExpense = { execute: vi.fn() }
const mockUpdateExpense = { execute: vi.fn() }
const mockDeleteExpense = { execute: vi.fn() }
const mockGetInstallmentGroup = { execute: vi.fn() }
const mockDeleteInstallmentGroup = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  listExpenses: mockListExpenses,
  getExpense: mockGetExpense,
  createExpense: mockCreateExpense,
  updateExpense: mockUpdateExpense,
  deleteExpense: mockDeleteExpense,
  getInstallmentGroup: mockGetInstallmentGroup,
  deleteInstallmentGroup: mockDeleteInstallmentGroup,
} as unknown as ExpensesDependencies

describe('Expenses Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createExpensesRouterWithDeps(mockDependencies)
    app.route('/expenses', router)
  })

  describe('POST /expenses - One-time expense', () => {
    it('creates single expense with valid input', async () => {
      const expense = createMockExpense({
        amount_cents: 5000,
        description: 'Grocery shopping',
      })

      mockCreateExpense.execute.mockResolvedValue(expense)

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
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = (await res.json()) as { data: Expense }
      expect(body.data).toEqual(expense)
      expect(mockCreateExpense.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          type: 'one_time',
          description: 'Grocery shopping',
          amount_cents: 5000,
        })
      )
    })

    it('creates expense with credit card', async () => {
      const creditCardId = '20000000-0000-4000-8000-000000000001'
      const expense = createMockExpense({
        payment_method: 'credit_card',
        credit_card_id: creditCardId,
      })

      mockCreateExpense.execute.mockResolvedValue(expense)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'one_time',
          category_id: expense.category_id,
          description: expense.description,
          amount_cents: expense.amount_cents,
          payment_method: 'credit_card',
          credit_card_id: creditCardId,
          date: expense.date,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      expect(mockCreateExpense.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          payment_method: 'credit_card',
          credit_card_id: creditCardId,
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

      mockCreateExpense.execute.mockResolvedValue(installments)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          category_id: installments[0]!.category_id,
          description: 'TV Purchase',
          amount_cents: 10000,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_total: 3,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = (await res.json()) as { data: Expense[] }
      expect(body.data).toHaveLength(3)

      // Verify amount distribution
      const totalAmount = body.data.reduce((sum, exp) => sum + exp.amount_cents, 0)
      expect(totalAmount).toBe(10000)

      // Verify installment metadata
      expect(body.data[0]!.installment_current).toBe(1)
      expect(body.data[1]!.installment_current).toBe(2)
      expect(body.data[2]!.installment_current).toBe(3)
      expect(body.data.every((exp) => exp.installment_total === 3)).toBe(true)
    })

    it('generates unique group ID for installments', async () => {
      const installments = [
        createMockExpense({ installment_group_id: 'group-abc' }),
        createMockExpense({ installment_group_id: 'group-abc' }),
      ]

      mockCreateExpense.execute.mockResolvedValue(installments)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          category_id: installments[0]!.category_id,
          description: 'Test',
          amount_cents: 1000,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_total: 2,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = (await res.json()) as { data: Expense[] }
      const groupId = body.data[0]!.installment_group_id
      expect(groupId).toBeDefined()
      expect(body.data.every((exp) => exp.installment_group_id === groupId)).toBe(true)
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

      mockCreateExpense.execute.mockResolvedValue(expense)

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
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = (await res.json()) as { data: Expense }
      expect(body.data.is_recurrent).toBe(true)
      expect(body.data.recurrence_day).toBe(15)
      expect(body.data.recurrence_start).toBe('2024-01-15')
    })

    it('creates recurrent expense with end date', async () => {
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 1,
        recurrence_start: '2024-01-01',
        recurrence_end: '2024-12-31',
      })

      mockCreateExpense.execute.mockResolvedValue(expense)

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
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: Expense }
      expect(body.data.recurrence_end).toBe('2024-12-31')
    })
  })

  describe('GET /expenses - List with filters', () => {
    it('lists all expenses for user', async () => {
      const expenses = [createMockExpense(), createMockExpense(), createMockExpense()]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: Expense[] }
      expect(body.data).toHaveLength(3)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(TEST_USER_ID, expect.any(Object))
    })

    it('filters by date range', async () => {
      const expenses = [createMockExpense({ date: '2024-01-15' })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?start_date=2024-01-01&end_date=2024-01-31', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        })
      )
    })

    it('filters by category', async () => {
      const categoryId = '10000000-0000-4000-8000-000000000001'
      const expenses = [createMockExpense({ category_id: categoryId })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request(`/expenses?category_id=${categoryId}`, {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          category_id: categoryId,
        })
      )
    })

    it('filters by payment method', async () => {
      const expenses = [createMockExpense({ payment_method: 'credit_card' })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?payment_method=credit_card', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          payment_method: 'credit_card',
        })
      )
    })

    it('filters by expense type - one_time', async () => {
      const expenses = [createMockExpense({ is_recurrent: false, installment_total: null })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?expense_type=one_time', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          expense_type: 'one_time',
        })
      )
    })

    it('filters by expense type - recurrent', async () => {
      const expenses = [createMockExpense({ is_recurrent: true })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?expense_type=recurrent', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          expense_type: 'recurrent',
        })
      )
    })

    it('filters by expense type - installment', async () => {
      const expenses = [createMockExpense({ installment_total: 3 })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?expense_type=installment', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          expense_type: 'installment',
        })
      )
    })

    it('filters by credit card', async () => {
      const cardId = '20000000-0000-4000-8000-000000000002'
      const expenses = [createMockExpense({ credit_card_id: cardId })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request(`/expenses?credit_card_id=${cardId}`, {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          credit_card_id: cardId,
        })
      )
    })

    it('filters for expenses without credit card', async () => {
      const expenses = [createMockExpense({ credit_card_id: null })]

      mockListExpenses.execute.mockResolvedValue(expenses)

      const res = await app.request('/expenses?credit_card_id=none', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          credit_card_id: 'none',
        })
      )
    })

    it('returns empty array when no expenses exist', async () => {
      mockListExpenses.execute.mockResolvedValue([])

      const res = await app.request('/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Expense[] }
      expect(body.data).toEqual([])
    })
  })

  describe('GET /expenses/paginated', () => {
    it('returns paginated expenses with metadata', async () => {
      const expenses = Array.from({ length: 10 }, () => createMockExpense())

      mockListExpenses.executePaginated.mockResolvedValue({
        data: expenses,
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          total_pages: 3,
        },
      })

      const res = await app.request('/expenses/paginated?page=1&limit=10', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as {
        data: Expense[]
        meta: { page: number; limit: number; total: number; total_pages: number }
      }
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

      mockListExpenses.executePaginated.mockResolvedValue({
        data: expenses,
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          total_pages: 3,
        },
      })

      const res = await app.request('/expenses/paginated?page=2&limit=10', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockListExpenses.executePaginated).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      )
    })
  })

  describe('GET /expenses/:id', () => {
    it('returns expense by ID', async () => {
      const expense = createMockExpense({ id: 'exp-123' })

      mockGetExpense.execute.mockResolvedValue(expense)

      const res = await app.request('/expenses/exp-123', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: Expense }
      expect(body.data.id).toBe('exp-123')
      expect(mockGetExpense.execute).toHaveBeenCalledWith(TEST_USER_ID, 'exp-123')
    })

    it('returns 404 when expense not found', async () => {
      mockGetExpense.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/expenses/nonexistent', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership', async () => {
      const expense = createMockExpense({ id: 'exp-123' })

      mockGetExpense.execute.mockResolvedValue(expense)

      await app.request('/expenses/exp-123', {
        method: 'GET',
      })

      expect(mockGetExpense.execute).toHaveBeenCalledWith(TEST_USER_ID, 'exp-123')
    })
  })

  describe('PATCH /expenses/:id', () => {
    it('updates expense with valid data', async () => {
      const updatedExpense = createMockExpense({
        id: 'exp-123',
        description: 'Updated description',
        amount_cents: 7500,
      })

      mockUpdateExpense.execute.mockResolvedValue(updatedExpense)

      const res = await app.request('/expenses/exp-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Updated description',
          amount_cents: 7500,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: Expense }
      expect(body.data.description).toBe('Updated description')
      expect(body.data.amount_cents).toBe(7500)
      expect(mockUpdateExpense.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'exp-123',
        expect.objectContaining({
          description: 'Updated description',
          amount_cents: 7500,
        })
      )
    })

    it('returns 404 when updating nonexistent expense', async () => {
      mockUpdateExpense.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/expenses/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership on update', async () => {
      const updatedExpense = createMockExpense({ id: 'exp-123' })

      mockUpdateExpense.execute.mockResolvedValue(updatedExpense)

      await app.request('/expenses/exp-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      })

      expect(mockUpdateExpense.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'exp-123',
        expect.any(Object)
      )
    })
  })

  describe('DELETE /expenses/:id', () => {
    it('deletes expense successfully', async () => {
      mockDeleteExpense.execute.mockResolvedValue(undefined)

      const res = await app.request('/expenses/exp-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteExpense.execute).toHaveBeenCalledWith(TEST_USER_ID, 'exp-123')
    })

    it('returns 404 when deleting nonexistent expense', async () => {
      mockDeleteExpense.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/expenses/nonexistent', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership on delete', async () => {
      mockDeleteExpense.execute.mockResolvedValue(undefined)

      await app.request('/expenses/exp-123', {
        method: 'DELETE',
      })

      expect(mockDeleteExpense.execute).toHaveBeenCalledWith(TEST_USER_ID, 'exp-123')
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

      mockGetInstallmentGroup.execute.mockResolvedValue(installments)

      const res = await app.request('/expenses/installments/group-123', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: Expense[] }
      expect(body.data).toHaveLength(3)
      expect(body.data[0]!.installment_current).toBe(1)
      expect(body.data[1]!.installment_current).toBe(2)
      expect(body.data[2]!.installment_current).toBe(3)
      expect(mockGetInstallmentGroup.execute).toHaveBeenCalledWith(TEST_USER_ID, 'group-123')
    })

    it('returns 404 for nonexistent group', async () => {
      mockGetInstallmentGroup.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Installment group not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/expenses/installments/nonexistent', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })

  describe('DELETE /expenses/installments/:groupId', () => {
    it('deletes all installments in group', async () => {
      mockDeleteInstallmentGroup.execute.mockResolvedValue(undefined)

      const res = await app.request('/expenses/installments/group-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteInstallmentGroup.execute).toHaveBeenCalledWith(TEST_USER_ID, 'group-123')
    })

    it('returns 404 when deleting nonexistent group', async () => {
      mockDeleteInstallmentGroup.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Installment group not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/expenses/installments/nonexistent', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership when deleting group', async () => {
      mockDeleteInstallmentGroup.execute.mockResolvedValue(undefined)

      await app.request('/expenses/installments/group-123', {
        method: 'DELETE',
      })

      expect(mockDeleteInstallmentGroup.execute).toHaveBeenCalledWith(TEST_USER_ID, 'group-123')
    })
  })

  describe('Boundary cases', () => {
    it('handles zero amount', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'one_time',
          category_id: '10000000-0000-4000-8000-000000000001',
          description: 'Test',
          amount_cents: 0,
          payment_method: 'pix',
          date: '2024-01-01',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles negative amount', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'one_time',
          category_id: '10000000-0000-4000-8000-000000000001',
          description: 'Test',
          amount_cents: -1000,
          payment_method: 'pix',
          date: '2024-01-01',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles maximum installment count', async () => {
      const installments = Array.from({ length: 12 }, (_, i) =>
        createMockExpense({
          installment_current: i + 1,
          installment_total: 12,
          installment_group_id: 'group-max',
        })
      )

      mockCreateExpense.execute.mockResolvedValue(installments)

      const res = await app.request('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          category_id: '10000000-0000-4000-8000-000000000001',
          description: 'Large purchase',
          amount_cents: 120000,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_total: 12,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: Expense[] }
      expect(body.data).toHaveLength(12)
    })

    it('handles maximum pagination page', async () => {
      mockListExpenses.executePaginated.mockResolvedValue({
        data: [],
        meta: {
          page: 999,
          limit: 10,
          total: 0,
          total_pages: 0,
        },
      })

      const res = await app.request('/expenses/paginated?page=999&limit=10', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as {
        data: Expense[]
        meta: { page: number; limit: number; total: number; total_pages: number }
      }
      expect(body.data).toEqual([])
      expect(body.meta.page).toBe(999)
    })
  })
})
