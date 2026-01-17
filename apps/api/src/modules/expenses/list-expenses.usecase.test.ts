import type { Expense, ExpenseFilters } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExpensesRepository } from './expenses.repository'
import { ListExpensesUseCase } from './list-expenses.usecase'

const oneTimeExpense: Expense = {
  id: 'expense-1',
  user_id: 'user-123',
  category_id: 'cat-1',
  description: 'One Time Expense',
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
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

const recurrentExpense: Expense = {
  id: 'expense-2',
  user_id: 'user-123',
  category_id: 'cat-1',
  description: 'Recurrent Expense',
  amount_cents: 3000,
  payment_method: 'debit_card',
  date: '2024-01-01',
  is_recurrent: true,
  recurrence_day: 10,
  recurrence_start: '2024-01-01',
  recurrence_end: null,
  installment_current: null,
  installment_total: null,
  installment_group_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ListExpensesUseCase', () => {
  let useCase: ListExpensesUseCase
  let mockRepository: {
    findByUserId: ReturnType<typeof vi.fn>
    findRecurrentByUserId: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      findRecurrentByUserId: vi.fn(),
    }
    useCase = new ListExpensesUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('returns expenses without filters', async () => {
    mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])

    const result = await useCase.execute('user-123')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      ...oneTimeExpense,
      is_projected: false,
    })
    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', undefined)
  })

  it('returns expenses with filters', async () => {
    const filters: ExpenseFilters = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      category_id: 'cat-1',
    }
    mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])
    mockRepository.findRecurrentByUserId.mockResolvedValue([])

    const result = await useCase.execute('user-123', filters)

    expect(result).toHaveLength(1)
    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', filters)
  })

  describe('recurrent expense projection', () => {
    it('projects recurrent expenses when date range provided', async () => {
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await useCase.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(0)
      expect(result.every((e) => e.is_projected)).toBe(true)
      expect(result.every((e) => e.source_expense_id === recurrentExpense.id)).toBe(true)
    })

    it('projects monthly occurrences correctly', async () => {
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await useCase.execute('user-123', filters)

      expect(result).toHaveLength(3)
      expect(result.map((e) => e.date)).toEqual(
        expect.arrayContaining(['2024-01-10', '2024-02-10', '2024-03-10'])
      )
    })

    it('respects recurrence_end when projecting', async () => {
      const expenseWithEnd: Expense = {
        ...recurrentExpense,
        recurrence_end: '2024-02-15',
      }
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([expenseWithEnd])

      const result = await useCase.execute('user-123', filters)

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.date)).toEqual(
        expect.arrayContaining(['2024-01-10', '2024-02-10'])
      )
    })

    it('filters projected expenses by category', async () => {
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        category_id: 'different-cat',
      }
      mockRepository.findByUserId.mockResolvedValue([])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await useCase.execute('user-123', filters)

      expect(result).toHaveLength(0)
    })

    it('combines regular and projected expenses sorted by date descending', async () => {
      const filters: ExpenseFilters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      }
      mockRepository.findByUserId.mockResolvedValue([oneTimeExpense])
      mockRepository.findRecurrentByUserId.mockResolvedValue([recurrentExpense])

      const result = await useCase.execute('user-123', filters)

      expect(result.length).toBeGreaterThan(1)
      const dates = result.map((e) => new Date(e.date).getTime())
      expect(dates).toEqual([...dates].sort((a, b) => b - a))
    })
  })
})
