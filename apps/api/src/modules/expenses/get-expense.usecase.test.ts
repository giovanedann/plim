import { ERROR_CODES, HTTP_STATUS, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { GetExpenseUseCase } from './get-expense.usecase'

type MockRepository = Pick<ExpensesRepository, 'findById'>

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
  }
}

describe('GetExpenseUseCase', () => {
  let sut: GetExpenseUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetExpenseUseCase(mockRepository as ExpensesRepository)
  })

  it('returns expense when found', async () => {
    const expense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
    mockRepository.findById = vi.fn().mockResolvedValue(expense)

    const result = await sut.execute('user-123', 'expense-1')

    expect(result).toEqual(expense)
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123', 'expense-1')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'expense-1')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
