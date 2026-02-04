import type { ExpenseFilters, PaginatedExpenseFilters } from '@plim/shared'
import { createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExpensesRepository } from './expenses.repository'
import { ListExpensesUseCase } from './list-expenses.usecase'

type MockRepository = {
  findByUserId: ReturnType<typeof vi.fn>
  findByUserIdPaginated: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
    findByUserIdPaginated: vi.fn(),
  }
}

describe('ListExpensesUseCase', () => {
  let sut: ListExpensesUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ListExpensesUseCase(mockRepository as unknown as ExpensesRepository)
  })

  describe('execute', () => {
    it('returns expenses without filters', async () => {
      const expenses = [
        createMockExpense({ description: 'Expense 1', date: '2024-01-15' }),
        createMockExpense({ description: 'Expense 2', date: '2024-01-10' }),
      ]
      mockRepository.findByUserId.mockResolvedValue(expenses)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(2)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', undefined)
    })

    it('returns expenses with filters', async () => {
      const expenses = [createMockExpense({ date: '2024-01-15' })]
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        category_id: 'cat-1',
      }
      mockRepository.findByUserId.mockResolvedValue(expenses)

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', filters)
    })

    it('returns empty array when no expenses exist', async () => {
      mockRepository.findByUserId.mockResolvedValue([])

      const result = await sut.execute('user-123')

      expect(result).toEqual([])
    })

    it('returns one-time expenses', async () => {
      const oneTimeExpense = createMockExpense({
        description: 'One Time Expense',
        is_recurrent: false,
        installment_total: null,
      })
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(1)
      expect(result[0]?.is_recurrent).toBe(false)
    })

    it('returns recurrent expenses (now materialized)', async () => {
      const recurrentExpense = createMockExpense({
        description: 'Recurring Expense',
        is_recurrent: true,
        recurrence_day: 10,
        recurrent_group_id: 'group-1',
        date: '2024-01-10',
      })
      mockRepository.findByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.is_recurrent).toBe(true)
      expect(result[0]?.recurrent_group_id).toBe('group-1')
    })

    it('returns installment expenses', async () => {
      const installmentExpense = createMockExpense({
        description: 'Installment Expense',
        installment_current: 1,
        installment_total: 3,
        installment_group_id: 'group-1',
      })
      mockRepository.findByUserId.mockResolvedValue([installmentExpense])

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(1)
      expect(result[0]?.installment_total).toBe(3)
    })

    it('filters by payment_method', async () => {
      const creditCardExpense = createMockExpense({ payment_method: 'credit_card' })
      mockRepository.findByUserId.mockResolvedValue([creditCardExpense])

      const result = await sut.execute('user-123', { payment_method: 'credit_card' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        payment_method: 'credit_card',
      })
    })

    it('filters by credit_card_id', async () => {
      const expense = createMockExpense({ credit_card_id: 'card-1' })
      mockRepository.findByUserId.mockResolvedValue([expense])

      const result = await sut.execute('user-123', { credit_card_id: 'card-1' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        credit_card_id: 'card-1',
      })
    })

    it('filters by expense_type one_time', async () => {
      const oneTimeExpense = createMockExpense({
        is_recurrent: false,
        installment_total: null,
      })
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

      const result = await sut.execute('user-123', { expense_type: 'one_time' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        expense_type: 'one_time',
      })
    })

    it('filters by expense_type recurrent', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 15,
        recurrent_group_id: 'group-1',
      })
      mockRepository.findByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', { expense_type: 'recurrent' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        expense_type: 'recurrent',
      })
    })

    it('filters by expense_type installment', async () => {
      const installmentExpense = createMockExpense({
        installment_current: 1,
        installment_total: 3,
        installment_group_id: 'group-1',
      })
      mockRepository.findByUserId.mockResolvedValue([installmentExpense])

      const result = await sut.execute('user-123', { expense_type: 'installment' })

      expect(result).toHaveLength(1)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', {
        expense_type: 'installment',
      })
    })

    it('handles large list of expenses', async () => {
      const expenses = Array.from({ length: 200 }, (_, i) =>
        createMockExpense({ description: `Expense ${i}`, date: '2024-01-15' })
      )
      mockRepository.findByUserId.mockResolvedValue(expenses)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(200)
    })
  })

  describe('executePaginated', () => {
    it('returns paginated expenses', async () => {
      const expenses = [
        createMockExpense({ description: 'Expense 1' }),
        createMockExpense({ description: 'Expense 2' }),
      ]
      mockRepository.findByUserIdPaginated.mockResolvedValue({ data: expenses, total: 10 })

      const filters: PaginatedExpenseFilters = { page: 1, limit: 2 }
      const result = await sut.executePaginated('user-123', filters)

      expect(result.data).toHaveLength(2)
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
      })
    })

    it('passes filters to repository', async () => {
      mockRepository.findByUserIdPaginated.mockResolvedValue({ data: [], total: 0 })

      const filters: PaginatedExpenseFilters = {
        page: 2,
        limit: 10,
        category_id: 'cat-1',
        payment_method: 'credit_card',
      }
      await sut.executePaginated('user-123', filters)

      expect(mockRepository.findByUserIdPaginated).toHaveBeenCalledWith(
        'user-123',
        { category_id: 'cat-1', payment_method: 'credit_card' },
        2,
        10
      )
    })

    it('calculates totalPages correctly', async () => {
      mockRepository.findByUserIdPaginated.mockResolvedValue({ data: [], total: 25 })

      const result = await sut.executePaginated('user-123', { page: 1, limit: 10 })

      expect(result.meta.totalPages).toBe(3) // Math.ceil(25/10) = 3
    })

    it('handles empty results', async () => {
      mockRepository.findByUserIdPaginated.mockResolvedValue({ data: [], total: 0 })

      const result = await sut.executePaginated('user-123', { page: 1, limit: 10 })

      expect(result.data).toEqual([])
      expect(result.meta.totalPages).toBe(0)
    })
  })
})
