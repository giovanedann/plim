import type { CreditCardLimitUsage } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS, getBillingCycleDates, getInvoiceMonth } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import type { GetOrCreateInvoiceUseCase } from './get-or-create-invoice.usecase'
import type { InvoicesRepository } from './invoices.repository'

export class GetCreditCardLimitUsageUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private creditCardsRepository: CreditCardsRepository,
    private getOrCreateInvoice: GetOrCreateInvoiceUseCase
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

    if (!creditCard.closing_day) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Credit card has no closing day configured',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const today = new Date().toISOString().split('T')[0]!
    const currentReferenceMonth = getInvoiceMonth(creditCard.closing_day, today)

    await this.getOrCreateInvoice.execute(userId, creditCardId, currentReferenceMonth)

    const unpaidInvoices = await this.invoicesRepository.findUnpaidByCard(creditCardId, userId)

    const invoiceTotal = unpaidInvoices.reduce(
      (sum, invoice) => sum + invoice.total_amount_cents - invoice.paid_amount_cents,
      0
    )

    const { cycleEnd } = getBillingCycleDates(creditCard.closing_day, currentReferenceMonth)
    const futureInstallments = await this.invoicesRepository.sumFutureInstallments(
      creditCardId,
      userId,
      cycleEnd
    )
    const recurrentCommitment = await this.invoicesRepository.sumActiveRecurrences(
      creditCardId,
      userId,
      today
    )

    const usedCents = invoiceTotal + futureInstallments
    const availableCents = Math.max(0, creditCard.credit_limit_cents - usedCents)

    return {
      credit_card_id: creditCardId,
      credit_limit_cents: creditCard.credit_limit_cents,
      used_cents: usedCents,
      available_cents: availableCents,
      recurrent_commitment_cents: recurrentCommitment,
    }
  }
}
