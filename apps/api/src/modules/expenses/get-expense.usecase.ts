import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'

export class GetExpenseUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, expenseId: string): Promise<Expense> {
    const expense = await this.expensesRepository.findById(expenseId, userId)

    if (!expense) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
    }

    return expense
  }
}
