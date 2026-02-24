import { type ApiResponse, api } from '@/lib/api-client'
import type { CreditCardLimitUsage, Expense, Invoice } from '@plim/shared'

export interface InvoiceWithTransactions {
  invoice: Invoice
  transactions: Expense[]
}

export const invoiceService = {
  async listInvoices(creditCardId: string): Promise<ApiResponse<Invoice[]>> {
    return api.get<Invoice[]>(`/invoices/${creditCardId}`)
  },

  async getInvoice(
    creditCardId: string,
    referenceMonth: string
  ): Promise<ApiResponse<InvoiceWithTransactions>> {
    return api.get<InvoiceWithTransactions>(`/invoices/${creditCardId}/${referenceMonth}`)
  },

  async payInvoice(invoiceId: string, amountCents: number): Promise<ApiResponse<Invoice>> {
    return api.post<Invoice>(`/invoices/${invoiceId}/pay`, { amount_cents: amountCents })
  },

  async getLimitUsage(creditCardId: string): Promise<ApiResponse<CreditCardLimitUsage>> {
    return api.get<CreditCardLimitUsage>(`/invoices/${creditCardId}/limit-usage`)
  },
}
