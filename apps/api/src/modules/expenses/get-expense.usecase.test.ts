import { ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import type { Expense } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { GetExpenseUseCase } from './get-expense.usecase'

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

describe('GetExpenseUseCase', () => {
  let useCase: GetExpenseUseCase
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
    }
    useCase = new GetExpenseUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('returns expense when found', async () => {
    mockRepository.findById.mockResolvedValue(baseExpense)

    const result = await useCase.execute('user-123', 'expense-1')

    expect(result).toEqual(baseExpense)
    expect(mockRepository.findById).toHaveBeenCalledWith('expense-1', 'user-123')
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
