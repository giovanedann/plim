import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'

export class DeleteInstallmentGroupUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, groupId: string): Promise<void> {
    const expenses = await this.expensesRepository.findByGroupId(groupId, userId)

    if (expenses.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Installment group not found',
        HTTP_STATUS.NOT_FOUND
      )
    }

    const deleted = await this.expensesRepository.deleteByGroupId(groupId, userId)

    if (!deleted) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to delete installment group',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}
