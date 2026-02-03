import {
  type CreateExpense,
  ERROR_CODES,
  type Expense,
  HTTP_STATUS,
  createMockExpense,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateExpenseUseCase } from './create-expense.usecase'
import type { ExpensesRepository } from './expenses.repository'

type MockRepository = {
  create: ReturnType<typeof vi.fn>
  createMany: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    create: vi.fn(),
    createMany: vi.fn(),
  }
}

describe('CreateExpenseUseCase', () => {
  let sut: CreateExpenseUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new CreateExpenseUseCase(mockRepository as unknown as ExpensesRepository)
  })

  describe('one-time expense', () => {
    it('creates and returns one-time expense', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
      }
      const expense = createMockExpense({
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
      })
      mockRepository.create.mockResolvedValue(expense)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(expense)
    })

    it('includes credit_card_id when provided', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        credit_card_id: 'card-123',
      }
      const expense = createMockExpense({ credit_card_id: 'card-123' })
      mockRepository.create.mockResolvedValue(expense)

      const result = (await sut.execute('user-123', input)) as Expense

      expect(result.credit_card_id).toBe('card-123')
    })

    it('throws INTERNAL_ERROR when creation fails', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
      }
      mockRepository.create.mockResolvedValue(null)

      await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe('recurrent expense', () => {
    it('creates and returns recurrent expense', async () => {
      const input: CreateExpense = {
        type: 'recurrent',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
      }
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: null,
      })
      mockRepository.create.mockResolvedValue(expense)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(expense)
    })

    it('includes recurrence_end when provided', async () => {
      const input: CreateExpense = {
        type: 'recurrent',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: '2024-12-15',
      }
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_end: '2024-12-15',
      })
      mockRepository.create.mockResolvedValue(expense)

      const result = (await sut.execute('user-123', input)) as Expense

      expect(result.recurrence_end).toBe('2024-12-15')
    })
  })

  describe('boundary cases', () => {
    it('handles minimum amount (1 cent)', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-1',
        description: 'Minimum expense',
        amount_cents: 1,
        payment_method: 'cash',
        date: '2024-01-15',
      }
      const expense = createMockExpense({ amount_cents: 1 })
      mockRepository.create.mockResolvedValue(expense)

      const result = (await sut.execute('user-123', input)) as Expense

      expect(result.amount_cents).toBe(1)
    })

    it('handles large amount values', async () => {
      const input: CreateExpense = {
        type: 'one_time',
        category_id: 'cat-1',
        description: 'Large expense',
        amount_cents: 999_999_99,
        payment_method: 'pix',
        date: '2024-01-15',
      }
      const expense = createMockExpense({ amount_cents: 999_999_99 })
      mockRepository.create.mockResolvedValue(expense)

      const result = (await sut.execute('user-123', input)) as Expense

      expect(result.amount_cents).toBe(999_999_99)
    })

    it('handles recurrent expense on day 31', async () => {
      const input: CreateExpense = {
        type: 'recurrent',
        category_id: 'cat-1',
        description: 'Last day recurrent',
        amount_cents: 5000,
        payment_method: 'debit_card',
        recurrence_day: 31,
        recurrence_start: '2024-01-31',
      }
      const expense = createMockExpense({
        is_recurrent: true,
        recurrence_day: 31,
        recurrence_start: '2024-01-31',
      })
      mockRepository.create.mockResolvedValue(expense)

      const result = (await sut.execute('user-123', input)) as Expense

      expect(result.recurrence_day).toBe(31)
    })
  })

  describe('installment expense', () => {
    it('creates multiple expenses for installments with divided amount', async () => {
      const installmentExpenses = [
        createMockExpense({
          id: 'exp-1',
          amount_cents: 1667,
          installment_current: 1,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-01-15',
        }),
        createMockExpense({
          id: 'exp-2',
          amount_cents: 1667,
          installment_current: 2,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-02-15',
        }),
        createMockExpense({
          id: 'exp-3',
          amount_cents: 1667,
          installment_current: 3,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-03-15',
        }),
      ]
      const input: CreateExpense = {
        type: 'installment',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        installment_total: 3,
      }
      mockRepository.createMany.mockResolvedValue(installmentExpenses)

      const result = (await sut.execute('user-123', input)) as Expense[]

      expect(result).toEqual(installmentExpenses)
      expect(result).toHaveLength(3)
      expect(result[0]!.amount_cents).toBe(1667)
      expect(result[0]!.installment_current).toBe(1)
      expect(result[2]!.installment_current).toBe(3)
    })

    it('rounds up installment amounts to avoid losing cents', async () => {
      const input: CreateExpense = {
        type: 'installment',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 10000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        installment_total: 3,
      }
      const installmentExpenses = [
        createMockExpense({ amount_cents: 3334 }),
        createMockExpense({ amount_cents: 3333 }),
        createMockExpense({ amount_cents: 3333 }),
      ]
      mockRepository.createMany.mockResolvedValue(installmentExpenses)

      const result = (await sut.execute('user-123', input)) as Expense[]

      expect(result[0]!.amount_cents).toBe(3334)
    })

    it('throws INTERNAL_ERROR when creation fails', async () => {
      const input: CreateExpense = {
        type: 'installment',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        installment_total: 3,
      }
      mockRepository.createMany.mockResolvedValue([])

      await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })
  })
})
