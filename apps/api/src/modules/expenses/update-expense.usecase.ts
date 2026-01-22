import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense, UpdateExpense } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'

export class UpdateExpenseUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, expenseId: string, input: UpdateExpense): Promise<Expense> {
    const existing = await this.expensesRepository.findById(expenseId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
    }

    const updated = await this.expensesRepository.update(expenseId, userId, input)

    if (!updated) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update expense',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return updated
  }
}
