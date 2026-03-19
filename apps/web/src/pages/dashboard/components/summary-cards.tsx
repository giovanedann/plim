import { SummaryCards as SharedSummaryCards } from '@/components/summary-cards'
import type { DashboardSummary } from '@plim/shared'

interface SummaryCardsProps {
  summary: DashboardSummary | undefined
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null

  return (
    <SharedSummaryCards
      data={{
        totalIncome: summary.total_income,
        totalExpenses: summary.total_expenses,
        balance: summary.balance,
        savingsRate: summary.savings_rate,
        previousIncome: summary.comparison.previous_income,
        previousExpenses: summary.comparison.previous_expenses,
        previousBalance: summary.comparison.previous_balance,
      }}
    />
  )
}
