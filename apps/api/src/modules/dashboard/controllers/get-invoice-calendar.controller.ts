import type { InvoiceCalendarResponse } from '@plim/shared'
import type { GetInvoiceCalendarUseCase } from '../get-invoice-calendar.usecase'

export async function getInvoiceCalendarController(
  userId: string,
  getInvoiceCalendarUseCase: GetInvoiceCalendarUseCase
): Promise<InvoiceCalendarResponse> {
  return getInvoiceCalendarUseCase.execute(userId)
}
