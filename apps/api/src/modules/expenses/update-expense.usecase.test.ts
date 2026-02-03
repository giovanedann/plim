import { ERROR_CODES, HTTP_STATUS, createMockExpense } from '@plim/shared'
import type { UpdateExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { UpdateExpenseUseCase } from './update-expense.usecase'

type MockRepository = {
  findById: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    update: vi.fn(),
  }
}

describe('UpdateExpenseUseCase', () => {
  let sut: UpdateExpenseUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new UpdateExpenseUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('updates and returns expense', async () => {
    const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
    const input: UpdateExpense = { description: 'Updated Expense' }
    const updatedExpense = { ...baseExpense, description: 'Updated Expense' }
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await sut.execute('user-123', 'expense-1', input)

    expect(result).toEqual(updatedExpense)
  })

  it('updates multiple fields at once', async () => {
    const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
    const input: UpdateExpense = {
      description: 'Updated Expense',
      amount_cents: 10000,
      category_id: 'cat-2',
    }
    const updatedExpense = { ...baseExpense, ...input }
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await sut.execute('user-123', 'expense-1', input)

    expect(result.description).toBe('Updated Expense')
    expect(result.amount_cents).toBe(10000)
    expect(result.category_id).toBe('cat-2')
  })

  it('throws NOT_FOUND when expense does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'expense-1', { description: 'Test' })).rejects.toThrow(
      AppError
    )
    await expect(
      sut.execute('user-123', 'expense-1', { description: 'Test' })
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('updates recurrent expense successfully', async () => {
    const recurrentExpense = createMockExpense({
      id: 'expense-1',
      user_id: 'user-123',
      is_recurrent: true,
      recurrence_day: 15,
    })
    const input: UpdateExpense = { description: 'Updated Recurrent', amount_cents: 7500 }
    const updatedExpense = { ...recurrentExpense, ...input }
    mockRepository.findById.mockResolvedValue(recurrentExpense)
    mockRepository.update.mockResolvedValue(updatedExpense)

    const result = await sut.execute('user-123', 'expense-1', input)

    expect(result.description).toBe('Updated Recurrent')
    expect(result.amount_cents).toBe(7500)
    expect(result.is_recurrent).toBe(true)
  })

  it('throws INTERNAL_ERROR when update fails', async () => {
    const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
    mockRepository.findById.mockResolvedValue(baseExpense)
    mockRepository.update.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'expense-1', { description: 'Test' })).rejects.toThrow(
      AppError
    )
    await expect(
      sut.execute('user-123', 'expense-1', { description: 'Test' })
    ).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary and edge cases', () => {
    it('handles empty description', async () => {
      const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
      const input: UpdateExpense = { description: '' }
      const updatedExpense = { ...baseExpense, description: '' }
      mockRepository.findById.mockResolvedValue(baseExpense)
      mockRepository.update.mockResolvedValue(updatedExpense)

      const result = await sut.execute('user-123', 'expense-1', input)

      expect(result.description).toBe('')
    })

    it('handles minimum amount (1 cent)', async () => {
      const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
      const input: UpdateExpense = { amount_cents: 1 }
      const updatedExpense = { ...baseExpense, amount_cents: 1 }
      mockRepository.findById.mockResolvedValue(baseExpense)
      mockRepository.update.mockResolvedValue(updatedExpense)

      const result = await sut.execute('user-123', 'expense-1', input)

      expect(result.amount_cents).toBe(1)
    })

    it('handles large amount values', async () => {
      const baseExpense = createMockExpense({ id: 'expense-1', user_id: 'user-123' })
      const input: UpdateExpense = { amount_cents: 999_999_99 }
      const updatedExpense = { ...baseExpense, amount_cents: 999_999_99 }
      mockRepository.findById.mockResolvedValue(baseExpense)
      mockRepository.update.mockResolvedValue(updatedExpense)

      const result = await sut.execute('user-123', 'expense-1', input)

      expect(result.amount_cents).toBe(999_999_99)
    })

    it('handles updating payment method', async () => {
      const baseExpense = createMockExpense({
        id: 'expense-1',
        user_id: 'user-123',
        payment_method: 'credit_card',
      })
      const input: UpdateExpense = { payment_method: 'pix' }
      const updatedExpense = { ...baseExpense, payment_method: 'pix' }
      mockRepository.findById.mockResolvedValue(baseExpense)
      mockRepository.update.mockResolvedValue(updatedExpense)

      const result = await sut.execute('user-123', 'expense-1', input)

      expect(result.payment_method).toBe('pix')
    })

    it('handles updating credit card ID', async () => {
      const baseExpense = createMockExpense({
        id: 'expense-1',
        user_id: 'user-123',
        credit_card_id: 'card-1',
      })
      const input: UpdateExpense = { credit_card_id: 'card-2' }
      const updatedExpense = { ...baseExpense, credit_card_id: 'card-2' }
      mockRepository.findById.mockResolvedValue(baseExpense)
      mockRepository.update.mockResolvedValue(updatedExpense)

      const result = await sut.execute('user-123', 'expense-1', input)

      expect(result.credit_card_id).toBe('card-2')
    })
  })
})
