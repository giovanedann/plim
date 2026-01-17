import { ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import type { CreateExpense, Expense } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateExpenseUseCase } from './create-expense.usecase'
import type { ExpensesRepository } from './expenses.repository'

const baseExpense: Expense = {
  id: 'expense-1',
  user_id: 'user-123',
  category_id: 'cat-1',
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
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

describe('CreateExpenseUseCase', () => {
  let useCase: CreateExpenseUseCase
  let mockRepository: {
    create: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      createMany: vi.fn(),
    }
    useCase = new CreateExpenseUseCase(mockRepository as unknown as ExpensesRepository)
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
      mockRepository.create.mockResolvedValue(baseExpense)

      const result = await useCase.execute('user-123', input)

      expect(result).toEqual(baseExpense)
      expect(mockRepository.create).toHaveBeenCalledWith('user-123', {
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        is_recurrent: false,
      })
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

      await expect(useCase.execute('user-123', input)).rejects.toThrow(AppError)
      await expect(useCase.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe('recurrent expense', () => {
    it('creates and returns recurrent expense', async () => {
      const recurrentExpense: Expense = {
        ...baseExpense,
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: null,
      }
      const input: CreateExpense = {
        type: 'recurrent',
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
      }
      mockRepository.create.mockResolvedValue(recurrentExpense)

      const result = await useCase.execute('user-123', input)

      expect(result).toEqual(recurrentExpense)
      expect(mockRepository.create).toHaveBeenCalledWith('user-123', {
        category_id: 'cat-1',
        description: 'Test Expense',
        amount_cents: 5000,
        payment_method: 'credit_card',
        date: '2024-01-15',
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: null,
      })
    })

    it('includes recurrence_end when provided', async () => {
      const recurrentExpense: Expense = {
        ...baseExpense,
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-01-15',
        recurrence_end: '2024-12-15',
      }
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
      mockRepository.create.mockResolvedValue(recurrentExpense)

      await useCase.execute('user-123', input)

      expect(mockRepository.create).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          recurrence_end: '2024-12-15',
        })
      )
    })
  })

  describe('installment expense', () => {
    it('creates multiple expenses for installments', async () => {
      const installmentExpenses: Expense[] = [
        {
          ...baseExpense,
          id: 'exp-1',
          installment_current: 1,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-01-15',
        },
        {
          ...baseExpense,
          id: 'exp-2',
          installment_current: 2,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-02-15',
        },
        {
          ...baseExpense,
          id: 'exp-3',
          installment_current: 3,
          installment_total: 3,
          installment_group_id: 'group-1',
          date: '2024-03-15',
        },
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

      const result = await useCase.execute('user-123', input)

      expect(result).toEqual(installmentExpenses)
      expect(mockRepository.createMany).toHaveBeenCalledWith(
        'user-123',
        expect.arrayContaining([
          expect.objectContaining({
            installment_current: 1,
            installment_total: 3,
          }),
          expect.objectContaining({
            installment_current: 2,
            installment_total: 3,
          }),
          expect.objectContaining({
            installment_current: 3,
            installment_total: 3,
          }),
        ])
      )
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

      await expect(useCase.execute('user-123', input)).rejects.toThrow(AppError)
      await expect(useCase.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })
  })
})
