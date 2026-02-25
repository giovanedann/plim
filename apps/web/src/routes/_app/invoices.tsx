import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { z } from 'zod'

const InvoicePage = lazy(() =>
  import('@/pages/credit-cards/invoices/invoice.page').then((m) => ({ default: m.InvoicePage }))
)

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const invoiceSearchSchema = z.object({
  cardId: z.string().uuid().optional(),
  month: z.string().optional().default(getCurrentMonth()),
})

export const Route = createFileRoute('/_app/invoices')({
  validateSearch: invoiceSearchSchema,
  component: InvoiceRoute,
})

function InvoiceRoute() {
  const { cardId, month } = Route.useSearch()

  return (
    <Suspense fallback={<PageLoader />}>
      <InvoicePage cardId={cardId ?? ''} month={month} />
    </Suspense>
  )
}
