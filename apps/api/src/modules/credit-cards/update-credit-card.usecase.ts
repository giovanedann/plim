import type { CreditCard, UpdateCreditCard } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'

export class UpdateCreditCardUseCase {
  constructor(private repository: CreditCardsRepository) {}

  async execute(
    userId: string,
    creditCardId: string,
    input: UpdateCreditCard
  ): Promise<CreditCard> {
    const existing = await this.repository.findById(creditCardId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
    }

    const creditCard = await this.repository.update(creditCardId, userId, input)

    if (!creditCard) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update credit card',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return creditCard
  }
}
