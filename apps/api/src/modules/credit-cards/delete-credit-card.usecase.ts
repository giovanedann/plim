import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'

export class DeleteCreditCardUseCase {
  constructor(private repository: CreditCardsRepository) {}

  async execute(userId: string, creditCardId: string): Promise<void> {
    const existing = await this.repository.findById(creditCardId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
    }

    const deleted = await this.repository.softDelete(creditCardId, userId)

    if (!deleted) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to delete credit card',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}
