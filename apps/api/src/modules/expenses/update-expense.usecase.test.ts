import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense, UpdateExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { UpdateExpenseUseCase } from './update-expense.usecase'

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

describe('UpdateExpenseUseCase', () => {
  let useCase: UpdateExpenseUseCase
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      update: vi.fn(),
    }
    useCase = new UpdateExpenseUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('updates and returns expense', async () => {
    const input: UpdateExpense = { description: 'Updated Expense' }
    const updatedExpense = { ...baseExpense, description: 'Updated Expense' }
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await useCase.execute('user-123', 'expense-1', input)

    expect(result).toEqual(updatedExpense)
    expect(mockRepository.findById).toHaveBeenCalledWith('expense-1', 'user-123')
    expect(mockRepository.update).toHaveBeenCalledWith('expense-1', 'user-123', input)
  })

  it('updates multiple fields at once', async () => {
    const input: UpdateExpense = {
      description: 'Updated Expense',
      amount_cents: 10000,
      category_id: 'cat-2',
    }
    const updatedExpense = { ...baseExpense, ...input }
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await useCase.execute('user-123', 'expense-1', input)

    expect(result).toMatchObject(input)
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute('user-123', 'expense-1', { description: 'Test' })).rejects.toThrow(
      AppError
    )
    await expect(
      useCase.execute('user-123', 'expense-1', { description: 'Test' })
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('updates recurrent expense successfully', async () => {
    const recurrentExpense = { ...baseExpense, is_recurrent: true, recurrence_day: 15 }
    const input: UpdateExpense = { description: 'Updated Recurrent', amount_cents: 7500 }
    const updatedExpense = { ...recurrentExpense, ...input }
    mockRepository.findById.mockResolvedValue(recurrentExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await useCase.execute('user-123', 'expense-1', input)

    expect(result).toEqual(updatedExpense)
    expect(mockRepository.update).toHaveBeenCalledWith('expense-1', 'user-123', input)
  })

  it('throws INTERNAL_ERROR when update fails', async () => {
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(null)

    await expect(useCase.execute('user-123', 'expense-1', { description: 'Test' })).rejects.toThrow(
      AppError
    )
    await expect(
      useCase.execute('user-123', 'expense-1', { description: 'Test' })
    ).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
