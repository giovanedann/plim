import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { MonthSelector } from '@/pages/expenses/components/month-selector'
import { categoryService } from '@/services/category.service'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { InvoiceSummaryCard } from './components/invoice-summary-card'
import { InvoiceTransactionsList } from './components/invoice-transactions-list'
import { PayInvoiceModal } from './components/pay-invoice-modal'
import { useInvoicePage } from './use-invoice.page'

interface InvoicePageProps {
  cardId: string
  month: string
}

export function InvoicePage({ cardId, month: initialMonth }: InvoicePageProps) {
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)

  const {
    invoice,
    transactions,
    creditCard,
    isLoading,
    hasClosingDay,
    payInvoice,
    isPayingInvoice,
    effectiveTotal,
    remaining,
  } = useInvoicePage(cardId, selectedMonth)

  const [isPayModalOpen, setIsPayModalOpen] = useState(false)

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const result = await categoryService.listCategories()
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.categories,
  })

  const handleMonthChange = (month: string): void => {
    setSelectedMonth(month)
    navigate({
      to: '/credit-cards/$cardId/invoices',
      params: { cardId },
      search: { month },
      replace: true,
    })
  }

  const handlePayConfirm = (amountCents: number): void => {
    payInvoice(amountCents)
    setIsPayModalOpen(false)
  }

  if (isLoading && !creditCard) {
    return (
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (creditCard && !hasClosingDay) {
    return (
      <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
        <div className="flex items-center gap-2">
          <Link to="/credit-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Faturas - {creditCard.name}</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">
            Este cartao nao tem dia de fechamento configurado
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Edite o cartao e defina o dia de fechamento para visualizar as faturas.
          </p>
          <Link to="/credit-cards" className="mt-4">
            <Button variant="outline">Voltar para cartoes</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link to="/credit-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Faturas</h1>
            {creditCard && <p className="text-sm text-muted-foreground">{creditCard.name}</p>}
          </div>
        </div>
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : invoice ? (
        <div className="grid gap-4">
          <InvoiceSummaryCard
            invoice={invoice}
            effectiveTotal={effectiveTotal}
            remaining={remaining}
          />

          {remaining > 0 && (
            <Button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full sm:w-auto sm:self-end"
            >
              Pagar fatura
            </Button>
          )}

          <InvoiceTransactionsList
            transactions={transactions}
            categories={categories}
            isLoading={isLoadingCategories}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Nenhuma fatura encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Nao ha transacoes neste periodo para gerar uma fatura.
          </p>
        </div>
      )}

      <PayInvoiceModal
        open={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        remaining={remaining}
        onConfirm={handlePayConfirm}
        isPending={isPayingInvoice}
      />
    </div>
  )
}
