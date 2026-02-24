import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type { Invoice, InvoiceStatus } from '@plim/shared'

interface InvoiceSummaryCardProps {
  invoice: Invoice
  effectiveTotal: number
  remaining: number
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  open: { label: 'Aberta', className: 'border-blue-500/50 text-blue-500 bg-blue-500/10' },
  partially_paid: {
    label: 'Parcialmente paga',
    className: 'border-amber-500/50 text-amber-500 bg-amber-500/10',
  },
  paid: { label: 'Paga', className: 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' },
}

function formatCycleDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function InvoiceSummaryCard({
  invoice,
  effectiveTotal,
  remaining,
}: InvoiceSummaryCardProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const statusConfig = STATUS_CONFIG[invoice.status]

  const displayValue = (cents: number): string => {
    if (hideValues) return '******'
    return formatBRL(cents)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resumo da Fatura</CardTitle>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatCycleDate(invoice.cycle_start)} a {formatCycleDate(invoice.cycle_end)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total de compras</span>
            <span className="text-sm font-medium">{displayValue(invoice.total_amount_cents)}</span>
          </div>

          {invoice.carry_over_cents > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo anterior</span>
              <span className="text-sm font-medium text-amber-500">
                {displayValue(invoice.carry_over_cents)}
              </span>
            </div>
          )}

          {invoice.carry_over_cents > 0 && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">Total efetivo</span>
              <span className="text-sm font-semibold">{displayValue(effectiveTotal)}</span>
            </div>
          )}

          {invoice.paid_amount_cents > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor pago</span>
              <span className="text-sm font-medium text-emerald-500">
                {displayValue(invoice.paid_amount_cents)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-sm font-semibold">Restante</span>
            <span
              className={`text-base font-bold ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}
            >
              {displayValue(remaining)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
