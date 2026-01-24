import { Skeleton } from '@/components/ui/skeleton'
import { CategoryBreakdownChart } from './components/category-breakdown-chart'
import { CreditCardBreakdownChart } from './components/credit-card-breakdown-chart'
import { ExpensesTimelineChart } from './components/expenses-timeline-chart'
import { IncomeExpensesChart } from './components/income-expenses-chart'
import { InstallmentForecast } from './components/installment-forecast'
import { PaymentBreakdownChart } from './components/payment-breakdown-chart'
import { SalaryTimelineChart } from './components/salary-timeline-chart'
import { SavingsRateChart } from './components/savings-rate-chart'
import { SummaryCards } from './components/summary-cards'
import { TimeRangeSelector } from './components/time-range-selector'
import { TopCategoriesChart } from './components/top-categories-chart'
import { useDashboard } from './use-dashboard'

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Skeleton className="h-80 rounded-xl" />
      </div>

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl md:col-span-2 lg:col-span-1" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const {
    timeRange,
    setTimeRange,
    summary,
    expensesTimeline,
    incomeVsExpenses,
    categoryBreakdown,
    paymentBreakdown,
    creditCardBreakdown,
    savingsRate,
    salaryTimeline,
    installmentForecast,
    isLoading,
  } = useDashboard()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const hasSalary = (summary?.total_income ?? 0) > 0

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças pessoais</p>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="px-4 lg:px-6">
        <SummaryCards summary={summary} />
      </div>

      {hasSalary && (
        <div className="px-4 lg:px-6">
          <IncomeExpensesChart data={incomeVsExpenses} />
        </div>
      )}

      <div className={`grid min-w-0 gap-4 px-4 lg:px-6 ${hasSalary ? 'md:grid-cols-2' : ''}`}>
        <div className="min-w-0">
          <ExpensesTimelineChart data={expensesTimeline} />
        </div>
        {hasSalary && (
          <div className="min-w-0">
            <SavingsRateChart data={savingsRate} />
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-4 px-4 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
        <div className="min-w-0">
          <CategoryBreakdownChart data={categoryBreakdown} />
        </div>
        <div className="min-w-0">
          <PaymentBreakdownChart data={paymentBreakdown} />
        </div>
        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          <CreditCardBreakdownChart data={creditCardBreakdown} />
        </div>
      </div>

      <div className={`grid min-w-0 gap-4 px-4 lg:px-6 ${hasSalary ? 'md:grid-cols-2' : ''}`}>
        <div className="min-w-0">
          <TopCategoriesChart data={categoryBreakdown} />
        </div>
        {hasSalary && (
          <div className="min-w-0">
            <SalaryTimelineChart data={salaryTimeline} />
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <InstallmentForecast data={installmentForecast} />
      </div>
    </div>
  )
}
