import { ProChartLock } from '@/components/pro-chart-lock'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { CategoryBreakdownChart } from './components/category-breakdown-chart'
import { CreditCardBreakdownChart } from './components/credit-card-breakdown-chart'
import { CreditCardUtilizationChart } from './components/credit-card-utilization-chart'
import { DayOfWeekChart } from './components/day-of-week-chart'
import { ExpensesTimelineChart } from './components/expenses-timeline-chart'
import { IncomeExpensesChart } from './components/income-expenses-chart'
import { InstallmentForecast } from './components/installment-forecast'
import { InvoiceCalendarChart } from './components/invoice-calendar-chart'
import { PaymentBreakdownChart } from './components/payment-breakdown-chart'
import { RecurringVsOnetimeChart } from './components/recurring-vs-onetime-chart'
import { SalaryTimelineChart } from './components/salary-timeline-chart'
import { SavingsRateChart } from './components/savings-rate-chart'
import { SpendingLimitGaugeChart } from './components/spending-limit-gauge-chart'
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

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      <div className="px-4 lg:px-6">
        <Skeleton className="h-64 rounded-xl" />
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
    creditCardUtilization,
    recurringVsOnetime,
    dayOfWeek,
    invoiceCalendar,
    spendingLimitProgress,
    isLoading,
  } = useDashboard()

  const { isPro } = usePlanLimits()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const hasIncome = (summary?.total_income ?? 0) > 0
  const showIncomeSection = hasIncome || !isPro

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças pessoais</p>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="px-4 lg:px-6" data-tutorial-id="dashboard-summary-cards">
        <SummaryCards summary={summary} />
      </div>

      {showIncomeSection && (
        <div className="px-4 lg:px-6">
          {isPro ? (
            <IncomeExpensesChart data={incomeVsExpenses!} />
          ) : (
            <ProChartLock title="Receita vs Despesas">
              <div className="h-80" />
            </ProChartLock>
          )}
        </div>
      )}

      <div
        className={`grid min-w-0 gap-4 px-4 lg:px-6 ${showIncomeSection ? 'md:grid-cols-2' : ''}`}
        data-tutorial-id="dashboard-charts"
      >
        <div className="min-w-0">
          <ExpensesTimelineChart data={expensesTimeline} />
        </div>
        {showIncomeSection && (
          <div className="min-w-0">
            {isPro ? (
              <SavingsRateChart data={savingsRate!} />
            ) : (
              <ProChartLock title="Taxa de Economia">
                <div className="h-64" />
              </ProChartLock>
            )}
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
          {isPro ? (
            <CreditCardBreakdownChart data={creditCardBreakdown!} />
          ) : (
            <ProChartLock title="Gastos por Cartão">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 px-4 md:grid-cols-2 lg:px-6">
        <div className="min-w-0">
          <CreditCardUtilizationChart data={creditCardUtilization} />
        </div>
        <div className="min-w-0">
          <RecurringVsOnetimeChart data={recurringVsOnetime} />
        </div>
      </div>

      <div
        className={`grid min-w-0 gap-4 px-4 lg:px-6 ${showIncomeSection ? 'md:grid-cols-2' : ''}`}
      >
        <div className="min-w-0">
          {isPro ? (
            <TopCategoriesChart data={categoryBreakdown} />
          ) : (
            <ProChartLock title="Top Categorias">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
        {showIncomeSection && (
          <div className="min-w-0">
            {isPro ? (
              <SalaryTimelineChart data={salaryTimeline!} />
            ) : (
              <ProChartLock title="Histórico de Salários">
                <div className="h-64" />
              </ProChartLock>
            )}
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-4 px-4 md:grid-cols-2 lg:px-6">
        <div className="min-w-0">
          {isPro ? (
            <DayOfWeekChart data={dayOfWeek!} />
          ) : (
            <ProChartLock title="Gastos por Dia da Semana">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
        <div className="min-w-0">
          {isPro ? (
            <SpendingLimitGaugeChart data={spendingLimitProgress} />
          ) : (
            <ProChartLock title="Limite de Gastos">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {isPro ? (
          <InvoiceCalendarChart data={invoiceCalendar!} />
        ) : (
          <ProChartLock title="Calendário de Faturas">
            <div className="h-64" />
          </ProChartLock>
        )}
      </div>

      <div className="px-4 lg:px-6">
        {isPro ? (
          <InstallmentForecast data={installmentForecast!} />
        ) : (
          <ProChartLock title="Previsão de Parcelas">
            <div className="h-64" />
          </ProChartLock>
        )}
      </div>
    </div>
  )
}
