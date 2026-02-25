import type { Invoice } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { createRemainderExpenseIfNeeded } from './create-remainder-expense'
import type { InvoicesRepository } from './invoices.repository'

function getNextMonth(referenceMonth: string): string {
  const [yearStr, monthStr] = referenceMonth.split('-')
  let year = Number(yearStr)
  let month = Number(monthStr)

  month += 1
  if (month > 12) {
    month = 1
    year += 1
  }

  return `${year}-${String(month).padStart(2, '0')}`
}

export class PayInvoiceUseCase {
  constructor(
    private repository: InvoicesRepository,
    private creditCardsRepository: CreditCardsRepository
  ) {}

  async execute(userId: string, invoiceId: string, amountCents: number): Promise<Invoice> {
    const invoice = await this.repository.findById(invoiceId, userId)

    if (!invoice) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Invoice not found', HTTP_STATUS.NOT_FOUND)
    }

    const effectiveTotal = invoice.total_amount_cents + invoice.carry_over_cents
    const remaining = effectiveTotal - invoice.paid_amount_cents

    if (amountCents > remaining) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Payment amount exceeds remaining balance',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const newPaidAmount = invoice.paid_amount_cents + amountCents
    const isFullyPaid = newPaidAmount >= effectiveTotal
    const status = isFullyPaid ? 'paid' : 'partially_paid'

    const updatedInvoice = await this.repository.update(invoiceId, userId, {
      paid_amount_cents: newPaidAmount,
      status,
      paid_at: isFullyPaid ? new Date().toISOString() : undefined,
    })

    if (!updatedInvoice) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update invoice',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    const nextMonth = getNextMonth(invoice.reference_month)
    const nextInvoice = await this.repository.findByCardAndMonth(
      invoice.credit_card_id,
      userId,
      nextMonth
    )

    if (nextInvoice) {
      const newRemaining = effectiveTotal - newPaidAmount
      await this.repository.update(nextInvoice.id, userId, {
        carry_over_cents: newRemaining,
      })
    }

    if (isFullyPaid) {
      await this.repository.deleteRemainderExpense(invoiceId, userId)
    } else {
      const today = new Date().toISOString().split('T')[0]!
      if (today > invoice.cycle_end) {
        const creditCard = await this.creditCardsRepository.findById(invoice.credit_card_id, userId)
        if (creditCard) {
          await createRemainderExpenseIfNeeded({
            invoice: updatedInvoice,
            creditCardName: creditCard.name,
            userId,
            repository: this.repository,
          })
        }
      }
    }

    return updatedInvoice
  }
}
