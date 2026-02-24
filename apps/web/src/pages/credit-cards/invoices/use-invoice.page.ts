import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { creditCardService } from '@/services/credit-card.service'
import { invoiceService } from '@/services/invoice.service'
import type { CreditCard, Expense, Invoice } from '@plim/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

function addMonths(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)
  const date = new Date(year, monthNum - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

interface UseInvoicePageResult {
  invoice: Invoice | null
  transactions: Expense[]
  invoices: Invoice[]
  creditCard: CreditCard | null
  isLoading: boolean
  isLoadingInvoices: boolean
  hasClosingDay: boolean
  selectedMonth: string
  goToPreviousMonth: () => string
  goToNextMonth: () => string
  previousMonth: string
  nextMonth: string
  payInvoice: (amountCents: number) => void
  isPayingInvoice: boolean
  effectiveTotal: number
  remaining: number
}

export function useInvoicePage(cardId: string, month: string): UseInvoicePageResult {
  const queryClient = useQueryClient()

  const creditCardQuery = useQuery({
    queryKey: queryKeys.creditCards,
    queryFn: async () => {
      const response = await creditCardService.listCreditCards()
      if (isErrorResponse(response)) throw new Error(response.error.message)
      return response.data
    },
    staleTime: queryConfig.staleTime.creditCards,
  })

  const creditCard = useMemo(
    () => creditCardQuery.data?.find((c) => c.id === cardId) ?? null,
    [creditCardQuery.data, cardId]
  )

  const hasClosingDay = creditCard?.closing_day !== null && creditCard?.closing_day !== undefined

  const invoiceQuery = useQuery({
    queryKey: queryKeys.invoice(cardId, month),
    queryFn: async () => {
      const response = await invoiceService.getInvoice(cardId, month)
      if (isErrorResponse(response)) throw new Error(response.error.message)
      return response.data
    },
    staleTime: queryConfig.staleTime.invoices,
    enabled: hasClosingDay,
  })

  const invoicesListQuery = useQuery({
    queryKey: queryKeys.invoices(cardId),
    queryFn: async () => {
      const response = await invoiceService.listInvoices(cardId)
      if (isErrorResponse(response)) throw new Error(response.error.message)
      return response.data
    },
    staleTime: queryConfig.staleTime.invoices,
    enabled: hasClosingDay,
  })

  const payMutation = useMutation({
    mutationFn: (amountCents: number) => {
      if (!invoiceQuery.data?.invoice.id) {
        throw new Error('No invoice to pay')
      }
      return invoiceService.payInvoice(invoiceQuery.data.invoice.id, amountCents)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoice(cardId, month) })
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(cardId) })
      toast.success('Pagamento registrado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao registrar pagamento')
    },
  })

  const invoice = invoiceQuery.data?.invoice ?? null
  const transactions = invoiceQuery.data?.transactions ?? []

  const effectiveTotal = (invoice?.total_amount_cents ?? 0) + (invoice?.carry_over_cents ?? 0)
  const remaining = effectiveTotal - (invoice?.paid_amount_cents ?? 0)

  const previousMonth = addMonths(month, -1)
  const nextMonth = addMonths(month, 1)

  return {
    invoice,
    transactions,
    invoices: invoicesListQuery.data ?? [],
    creditCard,
    isLoading: creditCardQuery.isLoading || invoiceQuery.isLoading,
    isLoadingInvoices: invoicesListQuery.isLoading,
    hasClosingDay,
    selectedMonth: month,
    goToPreviousMonth: () => previousMonth,
    goToNextMonth: () => nextMonth,
    previousMonth,
    nextMonth,
    payInvoice: (amountCents: number) => payMutation.mutate(amountCents),
    isPayingInvoice: payMutation.isPending,
    effectiveTotal,
    remaining,
  }
}
