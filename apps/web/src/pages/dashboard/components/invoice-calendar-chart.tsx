import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CardColor, InvoiceCalendarResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'

interface InvoiceCalendarChartProps {
  data: InvoiceCalendarResponse | undefined
}

const COLOR_HEX: Record<CardColor | 'default', string> = {
  black: '#18181b',
  dark_blue: '#1e3a8a',
  yellow: '#eab308',
  red: '#dc2626',
  orange: '#ea580c',
  light_purple: '#a855f7',
  neon_green: '#22c55e',
  neon_blue: '#06b6d4',
  white: '#f4f4f5',
  silver: '#71717a',
  gold: '#d97706',
  rose_gold: '#f472b6',
  default: '#94a3b8',
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

function isOverdue(dueDate: string, isPaid: boolean): boolean {
  if (isPaid) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  return due < today
}

interface GroupedInvoices {
  monthKey: string
  label: string
  items: InvoiceCalendarResponse['data']
}

export function InvoiceCalendarChart({ data }: InvoiceCalendarChartProps) {
  const grouped = useMemo((): GroupedInvoices[] => {
    if (!data?.data || data.data.length === 0) return []

    const sorted = [...data.data].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )

    const groups = new Map<string, InvoiceCalendarResponse['data']>()
    for (const item of sorted) {
      const key = getMonthKey(item.due_date)
      const existing = groups.get(key) ?? []
      existing.push(item)
      groups.set(key, existing)
    }

    return Array.from(groups.entries()).map(([monthKey, items]) => ({
      monthKey,
      label: getMonthLabel(monthKey),
      items,
    }))
  }, [data])

  if (!grouped.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Calendário de Faturas</CardTitle>
          <CardDescription>Próximas faturas a vencer</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhuma fatura próxima</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Calendário de Faturas</CardTitle>
        <CardDescription>Próximas faturas a vencer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] space-y-4 overflow-y-auto">
          {grouped.map((group) => (
            <div key={group.monthKey}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const overdue = isOverdue(item.due_date, item.is_paid)
                  const dotColor = COLOR_HEX[item.color as CardColor] ?? COLOR_HEX.default

                  return (
                    <div
                      key={`${item.credit_card_id}-${item.due_date}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="truncate text-foreground">{item.credit_card_name}</span>
                        <span
                          className={`shrink-0 text-xs ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                        >
                          {formatDueDate(item.due_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.is_paid ? (
                          <>
                            <span className="line-through text-muted-foreground">
                              {formatBRL(item.total_cents)}
                            </span>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          </>
                        ) : (
                          <span
                            className={overdue ? 'font-medium text-destructive' : 'font-medium'}
                          >
                            {formatBRL(item.total_cents)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
