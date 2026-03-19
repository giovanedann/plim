import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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

interface ComparisonChange {
  value: number | null
  label: string
}

function calculatePercentageChange(current: number, previous: number | null): ComparisonChange {
  if (previous === null) {
    return { value: null, label: 'Primeiro mês registrado' }
  }
  if (previous === 0 && current === 0) {
    return { value: 0, label: '0.0% vs mês anterior' }
  }
  if (previous === 0) {
    return { value: 100, label: '100.0% vs mês anterior' }
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  return { value: change, label: `${Math.abs(change).toFixed(1)}% vs mês anterior` }
}

function ChangeIndicator({
  comparison,
  positiveColor = 'text-emerald-500',
  negativeColor = 'text-red-500',
}: {
  comparison: ComparisonChange
  positiveColor?: string
  negativeColor?: string
}) {
  if (comparison.value === null) {
    return (
      <div className="mt-1 flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">{comparison.label}</span>
      </div>
    )
  }

  if (comparison.value === 0) {
    return (
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>{comparison.label}</span>
      </div>
    )
  }

  const isPositive = comparison.value > 0
  return (
    <div className="mt-1 flex items-center gap-1 text-xs">
      {isPositive ? (
        <ArrowUp className={cn('h-3 w-3', positiveColor)} />
      ) : (
        <ArrowDown className={cn('h-3 w-3', negativeColor)} />
      )}
      <span className={isPositive ? positiveColor : negativeColor}>{comparison.label}</span>
    </div>
  )
}

function getSavingsRateLabel(rate: number): string {
  if (rate >= 20) return 'Excelente!'
  if (rate >= 10) return 'Bom ritmo'
  if (rate >= 0) return 'Pode melhorar'
  return 'Gastos acima da receita'
}

export interface SummaryCardsData {
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  previousIncome?: number | null
  previousExpenses?: number | null
  previousBalance?: number | null
}

interface SummaryCardsProps {
  data: SummaryCardsData
  hideValues?: boolean
  showIncomeCard?: boolean
  leadingCard?: React.ReactNode
}

export function SummaryCards({
  data,
  hideValues = false,
  showIncomeCard = true,
  leadingCard,
}: SummaryCardsProps) {
  const maskValue = (value: number): string => (hideValues ? '••••••' : formatBRL(value))

  const hasIncome = data.totalIncome > 0

  const incomeComparison = calculatePercentageChange(data.totalIncome, data.previousIncome ?? null)
  const expenseComparison = calculatePercentageChange(
    data.totalExpenses,
    data.previousExpenses ?? null
  )
  const balanceComparison = calculatePercentageChange(data.balance, data.previousBalance ?? null)

  const cards = [
    {
      key: 'income',
      title: 'Receita',
      value: maskValue(data.totalIncome),
      icon: Wallet,
      iconClass: 'text-emerald-500',
      comparison: incomeComparison,
      positiveColor: 'text-emerald-500',
      negativeColor: 'text-red-500',
      show: hasIncome && showIncomeCard,
    },
    {
      key: 'expenses',
      title: 'Despesas',
      value: maskValue(data.totalExpenses),
      icon: TrendingDown,
      iconClass: 'text-red-500',
      comparison: expenseComparison,
      positiveColor: 'text-red-500',
      negativeColor: 'text-emerald-500',
      show: true,
    },
    {
      key: 'balance',
      title: 'Saldo',
      value: maskValue(data.balance),
      icon: TrendingUp,
      iconClass: data.balance >= 0 ? 'text-emerald-500' : 'text-red-500',
      comparison: balanceComparison,
      positiveColor: 'text-emerald-500',
      negativeColor: 'text-red-500',
      show: hasIncome,
    },
    {
      key: 'savings',
      title: 'Taxa de Economia',
      value: hideValues ? '••••••' : `${data.savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      iconClass: data.savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500',
      show: hasIncome,
      footer: (
        <div className="mt-1 text-xs text-muted-foreground">
          {getSavingsRateLabel(data.savingsRate)}
        </div>
      ),
    },
  ].filter((card) => card.show)

  const totalCards = cards.length + (leadingCard ? 1 : 0)
  const gridCols =
    totalCards <= 1 ? '' : totalCards === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {leadingCard}
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={cn('h-4 w-4', card.iconClass)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {'comparison' in card && card.comparison && (
                <ChangeIndicator
                  comparison={card.comparison}
                  positiveColor={card.positiveColor}
                  negativeColor={card.negativeColor}
                />
              )}
              {'footer' in card && card.footer}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
