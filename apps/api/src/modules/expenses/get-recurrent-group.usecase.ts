import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'

export class GetRecurrentGroupUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, groupId: string): Promise<Expense[]> {
    const expenses = await this.expensesRepository.findByRecurrentGroupId(groupId, userId)

    if (expenses.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Recurrent group not found', HTTP_STATUS.NOT_FOUND)
    }

    return expenses
  }
}
