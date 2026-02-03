import { ERROR_CODES, HTTP_STATUS, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
import type { ExpensesRepository } from './expenses.repository'

type MockRepository = Pick<ExpensesRepository, 'findById' | 'delete'>

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    delete: vi.fn(),
  }
}

describe('DeleteExpenseUseCase', () => {
  let sut: DeleteExpenseUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new DeleteExpenseUseCase(mockRepository as ExpensesRepository)
  })

  it('deletes expense successfully', async () => {
    const expense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
    mockRepository.findById = vi.fn().mockResolvedValue(expense)
    mockRepository.delete = vi.fn().mockResolvedValue(true)

    await expect(sut.execute('user-123', 'expense-1')).resolves.toBeUndefined()
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws INTERNAL_ERROR when delete fails', async () => {
    const expense = createMockExpense()
    mockRepository.findById = vi.fn().mockResolvedValue(expense)
    mockRepository.delete = vi.fn().mockResolvedValue(false)

    await expect(sut.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
