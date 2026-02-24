import type { CreditCardLimitUsage } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import type { InvoicesRepository } from './invoices.repository'

export class GetCreditCardLimitUsageUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private creditCardsRepository: CreditCardsRepository
  ) {}

  async execute(userId: string, creditCardId: string): Promise<CreditCardLimitUsage> {
    const creditCard = await this.creditCardsRepository.findById(creditCardId, userId)

    if (!creditCard) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
    }

    if (creditCard.credit_limit_cents === null) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Credit card has no limit set',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const unpaidInvoices = await this.invoicesRepository.findUnpaidByCard(creditCardId, userId)

    const usedCents = unpaidInvoices.reduce(
      (sum, invoice) =>
        sum + invoice.total_amount_cents + invoice.carry_over_cents - invoice.paid_amount_cents,
      0
    )

    const availableCents = Math.max(0, creditCard.credit_limit_cents - usedCents)

    return {
      credit_card_id: creditCardId,
      credit_limit_cents: creditCard.credit_limit_cents,
      used_cents: usedCents,
      available_cents: availableCents,
    }
  }
}
