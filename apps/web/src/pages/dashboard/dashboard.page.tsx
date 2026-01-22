import { CategoryBreakdownChart } from './components/category-breakdown-chart'
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

export function DashboardPage() {
  const {
    timeRange,
    setTimeRange,
    summary,
    expensesTimeline,
    incomeVsExpenses,
    categoryBreakdown,
    paymentBreakdown,
    savingsRate,
    salaryTimeline,
    installmentForecast,
    isSummaryLoading,
    isExpensesTimelineLoading,
    isIncomeVsExpensesLoading,
    isCategoryBreakdownLoading,
    isPaymentBreakdownLoading,
    isSavingsRateLoading,
    isSalaryTimelineLoading,
    isInstallmentForecastLoading,
  } = useDashboard()

  const hasSalary = summary?.total_income && summary.total_income > 0

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças pessoais</p>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="px-4 lg:px-6">
        <SummaryCards summary={summary} isLoading={isSummaryLoading} />
      </div>

      {hasSalary && (
        <div className="px-4 lg:px-6">
          <IncomeExpensesChart data={incomeVsExpenses} isLoading={isIncomeVsExpensesLoading} />
        </div>
      )}

      <div className={`grid min-w-0 gap-4 px-4 lg:px-6 ${hasSalary ? 'md:grid-cols-2' : ''}`}>
        <div className="min-w-0">
          <ExpensesTimelineChart data={expensesTimeline} isLoading={isExpensesTimelineLoading} />
        </div>
        {hasSalary && (
          <div className="min-w-0">
            <SavingsRateChart data={savingsRate} isLoading={isSavingsRateLoading} />
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-4 px-4 md:grid-cols-2 lg:px-6">
        <div className="min-w-0">
          <CategoryBreakdownChart data={categoryBreakdown} isLoading={isCategoryBreakdownLoading} />
        </div>
        <div className="min-w-0">
          <PaymentBreakdownChart data={paymentBreakdown} isLoading={isPaymentBreakdownLoading} />
        </div>
      </div>

      <div className={`grid min-w-0 gap-4 px-4 lg:px-6 ${hasSalary ? 'md:grid-cols-2' : ''}`}>
        <div className="min-w-0">
          <TopCategoriesChart data={categoryBreakdown} isLoading={isCategoryBreakdownLoading} />
        </div>
        {hasSalary && (
          <div className="min-w-0">
            <SalaryTimelineChart data={salaryTimeline} isLoading={isSalaryTimelineLoading} />
          </div>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <InstallmentForecast data={installmentForecast} isLoading={isInstallmentForecastLoading} />
      </div>
    </div>
  )
}
