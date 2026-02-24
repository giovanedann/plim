import { type ApiResponse, api } from '@/lib/api-client'
import type { CreditCardLimitUsage, Invoice } from '@plim/shared'

export const invoiceService = {
  async listInvoices(creditCardId: string): Promise<ApiResponse<Invoice[]>> {
    return api.get<Invoice[]>(`/invoices/${creditCardId}`)
  },

  async getInvoice(creditCardId: string, referenceMonth: string): Promise<ApiResponse<Invoice>> {
    return api.get<Invoice>(`/invoices/${creditCardId}/${referenceMonth}`)
  },

  async payInvoice(invoiceId: string, amountCents: number): Promise<ApiResponse<Invoice>> {
    return api.post<Invoice>(`/invoices/${invoiceId}/pay`, { amount_cents: amountCents })
  },

  async getLimitUsage(creditCardId: string): Promise<ApiResponse<CreditCardLimitUsage>> {
    return api.get<CreditCardLimitUsage>(`/invoices/${creditCardId}/limit-usage`)
  },
}
