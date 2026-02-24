import {
  ERROR_CODES,
  type Expense,
  HTTP_STATUS,
  type Invoice,
  getBillingCycleDates,
} from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import type { InvoicesRepository } from './invoices.repository'

interface GetOrCreateInvoiceResult {
  invoice: Invoice
  transactions: Expense[]
}

function getPreviousReferenceMonth(referenceMonth: string): string {
  const [yearStr, monthStr] = referenceMonth.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (month === 1) {
    return `${year - 1}-12`
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

export class GetOrCreateInvoiceUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private creditCardsRepository: CreditCardsRepository
  ) {}

  async execute(
    userId: string,
    creditCardId: string,
    referenceMonth: string
  ): Promise<GetOrCreateInvoiceResult> {
    const creditCard = await this.creditCardsRepository.findById(creditCardId, userId)

    if (!creditCard) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
    }

    if (!creditCard.closing_day) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Credit card has no closing day configured',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const { cycleStart, cycleEnd } = getBillingCycleDates(creditCard.closing_day, referenceMonth)

    const existingInvoice = await this.invoicesRepository.findByCardAndMonth(
      creditCardId,
      userId,
      referenceMonth
    )

    if (existingInvoice) {
      return this.handleExistingInvoice(existingInvoice, creditCardId, userId, cycleStart, cycleEnd)
    }

    return this.handleNewInvoice(creditCardId, userId, referenceMonth, cycleStart, cycleEnd)
  }

  private async handleExistingInvoice(
    invoice: Invoice,
    creditCardId: string,
    userId: string,
    cycleStart: string,
    cycleEnd: string
  ): Promise<GetOrCreateInvoiceResult> {
    const transactions = await this.invoicesRepository.getTransactionsForCycle(
      creditCardId,
      userId,
      cycleStart,
      cycleEnd
    )

    const totalAmountCents = transactions.reduce((sum, tx) => sum + tx.amount_cents, 0)

    if (totalAmountCents !== invoice.total_amount_cents) {
      const updatedInvoice = await this.invoicesRepository.update(invoice.id, userId, {
        total_amount_cents: totalAmountCents,
      })

      return {
        invoice: updatedInvoice ?? { ...invoice, total_amount_cents: totalAmountCents },
        transactions,
      }
    }

    return { invoice, transactions }
  }

  private async handleNewInvoice(
    creditCardId: string,
    userId: string,
    referenceMonth: string,
    cycleStart: string,
    cycleEnd: string
  ): Promise<GetOrCreateInvoiceResult> {
    const transactions = await this.invoicesRepository.getTransactionsForCycle(
      creditCardId,
      userId,
      cycleStart,
      cycleEnd
    )

    const totalAmountCents = transactions.reduce((sum, tx) => sum + tx.amount_cents, 0)

    const carryOverCents = await this.calculateCarryOver(creditCardId, userId, referenceMonth)

    const invoice = await this.invoicesRepository.create(userId, {
      credit_card_id: creditCardId,
      reference_month: referenceMonth,
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
      total_amount_cents: totalAmountCents,
      paid_amount_cents: 0,
      carry_over_cents: carryOverCents,
      status: 'open',
    })

    if (!invoice) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create invoice',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return { invoice, transactions }
  }

  private async calculateCarryOver(
    creditCardId: string,
    userId: string,
    referenceMonth: string
  ): Promise<number> {
    const previousRefMonth = getPreviousReferenceMonth(referenceMonth)
    const previousInvoice = await this.invoicesRepository.findByCardAndMonth(
      creditCardId,
      userId,
      previousRefMonth
    )

    if (!previousInvoice || previousInvoice.status === 'paid') {
      return 0
    }

    return (
      previousInvoice.total_amount_cents +
      previousInvoice.carry_over_cents -
      previousInvoice.paid_amount_cents
    )
  }
}
