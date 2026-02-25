import type { Invoice } from '@plim/shared'
import { getPortugueseMonthName } from '@plim/shared'
import type { InvoicesRepository } from './invoices.repository'

interface CreateRemainderExpenseParams {
  invoice: Invoice
  creditCardName: string
  userId: string
  repository: InvoicesRepository
}

export async function createRemainderExpenseIfNeeded({
  invoice,
  creditCardName,
  userId,
  repository,
}: CreateRemainderExpenseParams): Promise<void> {
  if (invoice.status === 'paid') return

  const remaining =
    invoice.total_amount_cents + invoice.carry_over_cents - invoice.paid_amount_cents

  if (remaining <= 0) return

  const existing = await repository.findRemainderExpense(invoice.id, userId)
  if (existing) return

  const monthName = getPortugueseMonthName(invoice.reference_month)
  const description = `Restante da Fatura de ${monthName} - ${creditCardName}`

  await repository.createRemainderExpense(
    userId,
    invoice.id,
    invoice.credit_card_id,
    remaining,
    description,
    invoice.cycle_end
  )
}
