import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
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

describe('DeleteExpenseUseCase', () => {
  let useCase: DeleteExpenseUseCase
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new DeleteExpenseUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('deletes expense successfully', async () => {
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.delete.mockResolvedValue(true)

    await expect(useCase.execute('user-123', 'expense-1')).resolves.toBeUndefined()
    expect(mockRepository.findById).toHaveBeenCalledWith('expense-1', 'user-123')
    expect(mockRepository.delete).toHaveBeenCalledWith('expense-1', 'user-123')
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it('throws INTERNAL_ERROR when delete fails', async () => {
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.delete.mockResolvedValue(false)

    await expect(useCase.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
