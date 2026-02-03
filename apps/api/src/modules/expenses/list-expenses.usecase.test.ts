import type { ExpenseFilters } from '@plim/shared'
import { createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExpensesRepository } from './expenses.repository'
import { ListExpensesUseCase } from './list-expenses.usecase'

type MockRepository = {
  findByUserId: ReturnType<typeof vi.fn>
  findRecurrentByUserId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
    findRecurrentByUserId: vi.fn(),
  }
}

describe('ListExpensesUseCase', () => {
  let sut: ListExpensesUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ListExpensesUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('returns expenses without filters', async () => {
    const oneTimeExpense = createMockExpense({
      description: 'One Time Expense',
      payment_method: 'credit_card',
      date: '2024-01-15',
    })
    mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

    const result = await sut.execute('user-123')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      ...oneTimeExpense,
      is_projected: false,
    })
  })

  it('returns expenses with filters', async () => {
    const oneTimeExpense = createMockExpense({ date: '2024-01-15' })
    const filters: ExpenseFilters = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      category_id: 'cat-1',
    }
    mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])
    mockRepository.findRecurrentByUserId.mockResolvedValue([])

    const result = await sut.execute('user-123', filters)

    expect(result).toHaveLength(1)
  })

  describe('recurrent expense projection', () => {
    it('projects recurrent expenses when date range provided', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        payment_method: 'debit_card',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((e) => e.is_projected)).toBe(true)
      expect(result.every((e) => e.source_expense_id === recurrentExpense.id)).toBe(true)
    })

    it('projects monthly occurrences correctly', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(3)
      expect(result.map((e) => e.date)).toEqual(
        expect.arrayContaining(['2024-01-10', '2024-02-10', '2024-03-10'])
      )
    })

    it('respects recurrence_end when projecting', async () => {
      const expenseWithEnd = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        recurrence_end: '2024-02-15',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([expenseWithEnd])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.date)).toEqual(
        expect.arrayContaining(['2024-01-10', '2024-02-10'])
      )
    })

    it('filters projected expenses by category', async () => {
      const recurrentExpense = createMockExpense({
        category_id: 'cat-1',
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        category_id: 'different-cat',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(0)
    })

    it('filters projected expenses by payment_method', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        payment_method: 'debit_card',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        payment_method: 'credit_card',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(0)
    })

    it('includes projected expenses matching payment_method filter', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        payment_method: 'debit_card',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        payment_method: 'debit_card',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
    })

    it('filters projected expenses by credit_card_id none', async () => {
      const recurrentWithCard = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        credit_card_id: 'card-123',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        credit_card_id: 'none',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentWithCard])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(0)
    })

    it('includes projected expenses with null credit_card_id when filtering by none', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        credit_card_id: null,
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        credit_card_id: 'none',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
    })

    it('filters projected expenses by specific credit_card_id', async () => {
      const recurrentWithCard = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        credit_card_id: 'card-123',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        credit_card_id: 'different-card',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentWithCard])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(0)
    })

    it('includes projected expenses matching specific credit_card_id', async () => {
      const recurrentWithCard = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
        credit_card_id: 'card-123',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        credit_card_id: 'card-123',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentWithCard])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
    })

    it('combines regular and projected expenses sorted by date descending', async () => {
      const oneTimeExpense = createMockExpense({ date: '2024-01-15' })
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      }
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(1)
      const dates = result.map((e) => new Date(e.date).getTime())
      expect(dates).toEqual([...dates].sort((a, b) => b - a))
    })
  })

  describe('boundary and edge cases', () => {
    it('returns empty array when no expenses exist', async () => {
      mockRepository.findByUserId.mockResolvedValue([])

      const result = await sut.execute('user-123')

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('handles single-day date range', async () => {
      const oneTimeExpense = createMockExpense({ date: '2024-01-15' })
      const filters: ExpenseFilters = {
        start_date: '2024-01-15',
        end_date: '2024-01-15',
      }
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])
      mockRepository.findRecurrentByUserId.mockResolvedValue([])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(1)
    })

    it('handles recurrent expense adjusting for shorter months', async () => {
      const lastDayExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 31,
        recurrence_start: '2024-01-31',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([lastDayExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
      // Feb 2024 has 29 days (leap year), so day 31 → day 29
      const februaryExpense = result.find((e) => e.date.startsWith('2024-02'))
      expect(februaryExpense?.date).toBe('2024-02-29')
    })

    it('projects recurrent expenses across year boundary', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-12-01',
        end_date: '2025-01-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.date)).toEqual(
        expect.arrayContaining(['2024-12-10', '2025-01-10'])
      )
    })

    it('handles recurrent expense starting after filter start date', async () => {
      const lateStartExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-02-15',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([lateStartExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((e) => e.date >= '2024-02-15')).toBe(true)
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

  describe('expense_type filtering', () => {
    it('returns only one-time expenses when filtering by one_time', async () => {
      const oneTimeExpense = createMockExpense({ date: '2024-01-15' })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        expense_type: 'one_time',
      }
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ ...oneTimeExpense, is_projected: false })
      expect(mockRepository.findRecurrentByUserId).not.toHaveBeenCalled()
    })

    it('returns only installment expenses when filtering by installment', async () => {
      const installmentExpense = createMockExpense({
        date: '2024-01-20',
        installment_current: 1,
        installment_total: 3,
        installment_group_id: 'group-1',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        expense_type: 'installment',
      }
      mockRepository.findByUserId.mockResolvedValue([installmentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ ...installmentExpense, is_projected: false })
      expect(mockRepository.findRecurrentByUserId).not.toHaveBeenCalled()
    })

    it('projects recurrent expenses when filtering by recurrent', async () => {
      const recurrentExpense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 10,
        recurrence_start: '2024-01-01',
      })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        expense_type: 'recurrent',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await sut.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((e) => e.is_projected)).toBe(true)
      expect(mockRepository.findRecurrentByUserId).toHaveBeenCalled()
    })

    it('skips recurrent projection when filtering by one_time even with date range', async () => {
      const oneTimeExpense = createMockExpense({ date: '2024-01-15' })
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        expense_type: 'one_time',
      }
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

      const result = await sut.execute('user-123', filters)

      expect(result).toHaveLength(1)
      expect(mockRepository.findRecurrentByUserId).not.toHaveBeenCalled()
    })
  })
})
