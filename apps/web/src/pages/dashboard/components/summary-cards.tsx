import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardSummary } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import {
  ArrowDown,
  ArrowUp,
  Minus,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

interface SummaryCardsProps {
  summary: DashboardSummary | undefined
}

function formatPercentChange(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs">{formatPercentChange(value)}</span>
      </span>
    )
  }

  const isPositive = value > 0
  return (
    <span
      className={cn('flex items-center gap-1', isPositive ? 'text-emerald-500' : 'text-red-500')}
    >
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      <span className="text-xs">{formatPercentChange(value)}</span>
    </span>
  )
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null

  const hasSalary = summary.total_income > 0

  const cards = [
    {
      title: 'Receita',
      value: formatBRL(summary.total_income),
      change: summary.comparison.income_change_percent,
      icon: TrendingUp,
      iconClass: 'text-emerald-500',
      show: hasSalary,
    },
    {
      title: 'Despesas',
      value: formatBRL(summary.total_expenses),
      change: summary.comparison.expenses_change_percent,
      icon: TrendingDown,
      iconClass: 'text-red-500',
      invertChange: true,
      show: true,
    },
    {
      title: 'Saldo',
      value: formatBRL(summary.balance),
      change: summary.comparison.balance_change_percent,
      icon: Wallet,
      iconClass: summary.balance >= 0 ? 'text-emerald-500' : 'text-red-500',
      show: hasSalary,
    },
    {
      title: 'Taxa de Economia',
      value: `${summary.savings_rate.toFixed(1)}%`,
      icon: PiggyBank,
      iconClass: summary.savings_rate > 0 ? 'text-emerald-500' : 'text-amber-500',
      show: hasSalary,
    },
  ].filter((card) => card.show)

  const gridCols =
    cards.length === 1
      ? ''
      : cards.length === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={cn('h-4 w-4', card.iconClass)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change !== undefined && (
                <div className="mt-1">
                  <ChangeIndicator value={card.invertChange ? -card.change : card.change} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
