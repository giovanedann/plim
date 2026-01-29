import {
  type CreateExpense,
  type UpdateExpense,
  createErrorResponse,
  createMockExpense,
  createPaginatedResponse,
  createSuccessResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expenseService } from './expense.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    getPaginated: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

describe('expenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listExpenses', () => {
    it('calls correct endpoint without filters', async () => {
      const mockExpenses = [createMockExpense(), createMockExpense()]
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockExpenses))

      const result = await expenseService.listExpenses()

      expect(api.get).toHaveBeenCalledWith('/expenses')
      expect(result).toEqual({ data: mockExpenses })
    })

    it('builds query string with all filters', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse([]))

      await expenseService.listExpenses({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        category_id: 'cat-123',
        payment_method: 'pix',
        expense_type: 'one_time',
        credit_card_id: 'card-456',
      })

      expect(api.get).toHaveBeenCalledWith(
        '/expenses?start_date=2026-01-01&end_date=2026-01-31&category_id=cat-123&payment_method=pix&expense_type=one_time&credit_card_id=card-456'
      )
    })

    it('omits undefined filter values from query string', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse([]))

      await expenseService.listExpenses({
        start_date: '2026-01-01',
        category_id: undefined,
      })

      expect(api.get).toHaveBeenCalledWith('/expenses?start_date=2026-01-01')
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expenses not found')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await expenseService.listExpenses()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('listExpensesPaginated', () => {
    it('calls correct endpoint with pagination params', async () => {
      const mockExpenses = [createMockExpense()]
      vi.mocked(api.getPaginated).mockResolvedValue(
        createPaginatedResponse(mockExpenses, { page: 2, limit: 10, total: 25 })
      )

      const result = await expenseService.listExpensesPaginated({ page: 2, limit: 10 })

      expect(api.getPaginated).toHaveBeenCalledWith('/expenses/paginated?page=2&limit=10')
      expect(result).toEqual({
        data: mockExpenses,
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      })
    })

    it('combines filters with pagination params', async () => {
      vi.mocked(api.getPaginated).mockResolvedValue(createPaginatedResponse([]))

      await expenseService.listExpensesPaginated({
        page: 1,
        limit: 20,
        start_date: '2026-01-01',
        payment_method: 'credit_card',
      })

      expect(api.getPaginated).toHaveBeenCalledWith(
        '/expenses/paginated?start_date=2026-01-01&payment_method=credit_card&page=1&limit=20'
      )
    })
  })

  describe('getExpense', () => {
    it('calls correct endpoint with expense id', async () => {
      const mockExpense = createMockExpense({ id: 'expense-123' })
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockExpense))

      const result = await expenseService.getExpense('expense-123')

      expect(api.get).toHaveBeenCalledWith('/expenses/expense-123')
      expect(result).toEqual({ data: mockExpense })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await expenseService.getExpense('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createExpense', () => {
    it('sends correct payload for one-time expense', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-123',
        description: 'Test expense',
        amount_cents: 5000,
        payment_method: 'pix',
        date: '2026-01-15',
      }
      const createdExpense = createMockExpense({ description: 'Test expense' })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdExpense))

      const result = await expenseService.createExpense(input)

      expect(api.post).toHaveBeenCalledWith('/expenses', input)
      expect(result).toEqual({ data: createdExpense })
    })

    it('sends correct payload for recurrent expense', async () => {
      const input: CreateExpense = {
        type: 'recurrent',
        category_id: 'cat-123',
        description: 'Monthly subscription',
        amount_cents: 2999,
        payment_method: 'credit_card',
        recurrence_day: 15,
        recurrence_start: '2026-01-15',
        credit_card_id: 'card-456',
      }
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockExpense()))

      await expenseService.createExpense(input)

      expect(api.post).toHaveBeenCalledWith('/expenses', input)
    })

    it('sends correct payload for installment expense', async () => {
      const input: CreateExpense = {
        type: 'installment',
        category_id: 'cat-123',
        description: 'TV Purchase',
        amount_cents: 150000,
        payment_method: 'credit_card',
        date: '2026-01-15',
        installment_total: 12,
        credit_card_id: 'card-456',
      }
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockExpense()))

      await expenseService.createExpense(input)

      expect(api.post).toHaveBeenCalledWith('/expenses', input)
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
        field: 'amount_cents',
      })
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await expenseService.createExpense({
        type: 'one_time',
        category_id: 'cat-123',
        description: 'Test',
        amount_cents: 100,
        payment_method: 'pix',
        date: '2026-01-15',
      })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('updateExpense', () => {
    it('sends correct payload with partial update', async () => {
      const input: UpdateExpense = {
        description: 'Updated description',
        amount_cents: 7500,
      }
      const updatedExpense = createMockExpense({
        id: 'expense-123',
        description: 'Updated description',
        amount_cents: 7500,
      })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedExpense))

      const result = await expenseService.updateExpense('expense-123', input)

      expect(api.patch).toHaveBeenCalledWith('/expenses/expense-123', input)
      expect(result).toEqual({ data: updatedExpense })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await expenseService.updateExpense('non-existent', { amount_cents: 100 })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteExpense', () => {
    it('calls correct endpoint with expense id', async () => {
      vi.mocked(api.delete).mockResolvedValue(
        createSuccessResponse(undefined as unknown as undefined)
      )

      const result = await expenseService.deleteExpense('expense-123')

      expect(api.delete).toHaveBeenCalledWith('/expenses/expense-123')
      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await expenseService.deleteExpense('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('cancelRecurrence', () => {
    it('sends patch request with recurrence_end date', async () => {
      const updatedExpense = createMockExpense({
        id: 'expense-123',
        is_recurrent: true,
        recurrence_end: '2026-03-31',
      })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedExpense))

      const result = await expenseService.cancelRecurrence('expense-123', '2026-03-31')

      expect(api.patch).toHaveBeenCalledWith('/expenses/expense-123', {
        recurrence_end: '2026-03-31',
      })
      expect(result).toEqual({ data: updatedExpense })
    })
  })

  describe('getInstallmentGroup', () => {
    it('calls correct endpoint with group id', async () => {
      const mockInstallments = [
        createMockExpense({ installment_current: 1, installment_total: 3 }),
        createMockExpense({ installment_current: 2, installment_total: 3 }),
        createMockExpense({ installment_current: 3, installment_total: 3 }),
      ]
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockInstallments))

      const result = await expenseService.getInstallmentGroup('group-123')

      expect(api.get).toHaveBeenCalledWith('/expenses/installments/group-123')
      expect(result).toEqual({ data: mockInstallments })
    })

    it('returns error response when group not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Installment group not found')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await expenseService.getInstallmentGroup('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteInstallmentGroup', () => {
    it('calls correct endpoint with group id', async () => {
      vi.mocked(api.delete).mockResolvedValue(
        createSuccessResponse(undefined as unknown as undefined)
      )

      const result = await expenseService.deleteInstallmentGroup('group-123')

      expect(api.delete).toHaveBeenCalledWith('/expenses/installments/group-123')
      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when group not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Installment group not found')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await expenseService.deleteInstallmentGroup('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })
})
