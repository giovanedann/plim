import type { ApiPaginatedResponse, ApiSuccessResponse, Expense } from '@plim/shared'
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

type MockApi = {
  get: ReturnType<typeof vi.fn>
  getPaginated: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('expenseService', () => {
  let mockApi: MockApi

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi = api as MockApi
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listExpenses', () => {
    it('fetches expenses without filters', async () => {
      const mockExpenses = [createMockExpense(), createMockExpense()]
      mockApi.get.mockResolvedValue(createSuccessResponse(mockExpenses))
      const sut = expenseService

      const result = await sut.listExpenses()

      expect(result).toEqual({ data: mockExpenses })
    })

    it('builds query string with all filters', async () => {
      mockApi.get.mockResolvedValue(createSuccessResponse([]))
      const sut = expenseService

      await sut.listExpenses({
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        category_id: 'cat-123',
        payment_method: 'pix',
        expense_type: 'one_time',
        credit_card_id: 'card-456',
      })

      expect(mockApi.get).toHaveBeenCalledWith(
        '/expenses?start_date=2026-01-01&end_date=2026-01-31&category_id=cat-123&payment_method=pix&expense_type=one_time&credit_card_id=card-456'
      )
    })

    it('omits undefined filter values from query string', async () => {
      mockApi.get.mockResolvedValue(createSuccessResponse([]))
      const sut = expenseService

      await sut.listExpenses({
        start_date: '2026-01-01',
        category_id: undefined,
      })

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?start_date=2026-01-01')
    })

    it('returns empty array when no expenses exist', async () => {
      mockApi.get.mockResolvedValue(createSuccessResponse([]))
      const sut = expenseService

      const result = await sut.listExpenses()

      expect(result).toEqual({ data: [] })
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expenses not found')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.listExpenses()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('listExpensesPaginated', () => {
    it('fetches paginated expenses with pagination params', async () => {
      const mockExpenses = [createMockExpense()]
      mockApi.getPaginated.mockResolvedValue(
        createPaginatedResponse(mockExpenses, { page: 2, limit: 10, total: 25 })
      )
      const sut = expenseService

      const result = await sut.listExpensesPaginated({ page: 2, limit: 10 })

      expect(result).toEqual({
        data: mockExpenses,
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      })
    })

    it('combines filters with pagination params', async () => {
      mockApi.getPaginated.mockResolvedValue(createPaginatedResponse([]))
      const sut = expenseService

      await sut.listExpensesPaginated({
        page: 1,
        limit: 20,
        start_date: '2026-01-01',
        payment_method: 'credit_card',
      })

      expect(mockApi.getPaginated).toHaveBeenCalledWith(
        '/expenses/paginated?start_date=2026-01-01&payment_method=credit_card&page=1&limit=20'
      )
    })

    it('returns empty data array for empty page', async () => {
      mockApi.getPaginated.mockResolvedValue(
        createPaginatedResponse([], { page: 1, limit: 10, total: 0 })
      )
      const sut = expenseService

      const result = (await sut.listExpensesPaginated({
        page: 1,
        limit: 10,
      })) as ApiPaginatedResponse<Expense>

      expect(result.data).toEqual([])
      expect(result.meta.total).toBe(0)
    })
  })

  describe('getExpense', () => {
    it('fetches expense by id', async () => {
      const mockExpense = createMockExpense({ id: 'expense-123' })
      mockApi.get.mockResolvedValue(createSuccessResponse(mockExpense))
      const sut = expenseService

      const result = await sut.getExpense('expense-123')

      expect(result).toEqual({ data: mockExpense })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.getExpense('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createExpense', () => {
    it('creates one-time expense', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-123',
        description: 'Test expense',
        amount_cents: 5000,
        payment_method: 'pix',
        date: '2026-01-15',
      }
      const createdExpense = createMockExpense({ description: 'Test expense' })
      mockApi.post.mockResolvedValue(createSuccessResponse(createdExpense))
      const sut = expenseService

      const result = await sut.createExpense(input)

      expect(result).toEqual({ data: createdExpense })
    })

    it('creates recurrent expense', async () => {
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
      mockApi.post.mockResolvedValue(createSuccessResponse(createMockExpense()))
      const sut = expenseService

      const result = await sut.createExpense(input)

      expect(result).toHaveProperty('data')
    })

    it('creates installment expense', async () => {
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
      mockApi.post.mockResolvedValue(createSuccessResponse(createMockExpense()))
      const sut = expenseService

      const result = await sut.createExpense(input)

      expect(result).toHaveProperty('data')
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
        field: 'amount_cents',
      })
      mockApi.post.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.createExpense({
        type: 'one_time',
        category_id: 'cat-123',
        description: 'Test',
        amount_cents: 100,
        payment_method: 'pix',
        date: '2026-01-15',
      })

      expect(result).toEqual(errorResponse)
    })

    it('handles zero amount expense', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-123',
        description: 'Free item',
        amount_cents: 0,
        payment_method: 'pix',
        date: '2026-01-15',
      }
      const createdExpense = createMockExpense({ amount_cents: 0 })
      mockApi.post.mockResolvedValue(createSuccessResponse(createdExpense))
      const sut = expenseService

      const result = (await sut.createExpense(input)) as ApiSuccessResponse<Expense>

      expect(result.data.amount_cents).toBe(0)
    })
  })

  describe('updateExpense', () => {
    it('updates expense with partial data', async () => {
      const input: UpdateExpense = {
        description: 'Updated description',
        amount_cents: 7500,
      }
      const updatedExpense = createMockExpense({
        id: 'expense-123',
        description: 'Updated description',
        amount_cents: 7500,
      })
      mockApi.patch.mockResolvedValue(createSuccessResponse(updatedExpense))
      const sut = expenseService

      const result = await sut.updateExpense('expense-123', input)

      expect(result).toEqual({ data: updatedExpense })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      mockApi.patch.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.updateExpense('non-existent', { amount_cents: 100 })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteExpense', () => {
    it('deletes expense by id', async () => {
      mockApi.delete.mockResolvedValue(createSuccessResponse(undefined as unknown as undefined))
      const sut = expenseService

      const result = await sut.deleteExpense('expense-123')

      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when expense not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Expense not found')
      mockApi.delete.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.deleteExpense('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('cancelRecurrence', () => {
    it('cancels recurrence by setting end date', async () => {
      const updatedExpense = createMockExpense({
        id: 'expense-123',
        is_recurrent: true,
        recurrence_end: '2026-03-31',
      })
      mockApi.patch.mockResolvedValue(createSuccessResponse(updatedExpense))
      const sut = expenseService

      const result = await sut.cancelRecurrence('expense-123', '2026-03-31')

      expect(result).toEqual({ data: updatedExpense })
    })
  })

  describe('getInstallmentGroup', () => {
    it('fetches all installments in group', async () => {
      const mockInstallments = [
        createMockExpense({ installment_current: 1, installment_total: 3 }),
        createMockExpense({ installment_current: 2, installment_total: 3 }),
        createMockExpense({ installment_current: 3, installment_total: 3 }),
      ]
      mockApi.get.mockResolvedValue(createSuccessResponse(mockInstallments))
      const sut = expenseService

      const result = (await sut.getInstallmentGroup('group-123')) as ApiSuccessResponse<Expense[]>

      expect(result).toEqual({ data: mockInstallments })
      expect(result.data).toHaveLength(3)
    })

    it('returns error response when group not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Installment group not found')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.getInstallmentGroup('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteInstallmentGroup', () => {
    it('deletes entire installment group', async () => {
      mockApi.delete.mockResolvedValue(createSuccessResponse(undefined as unknown as undefined))
      const sut = expenseService

      const result = await sut.deleteInstallmentGroup('group-123')

      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when group not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Installment group not found')
      mockApi.delete.mockResolvedValue(errorResponse)
      const sut = expenseService

      const result = await sut.deleteInstallmentGroup('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })
})
