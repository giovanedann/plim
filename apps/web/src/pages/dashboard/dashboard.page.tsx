import { ProChartLock } from '@/components/pro-chart-lock'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { Suspense } from 'react'
import {
  CategoryBreakdownChart,
  CreditCardBreakdownChart,
  CreditCardUtilizationChart,
  DayOfWeekChart,
  ExpensesTimelineChart,
  IncomeExpensesChart,
  InstallmentForecast,
  InvoiceCalendarChart,
  PaymentBreakdownChart,
  RecurringVsOnetimeChart,
  SalaryTimelineChart,
  SavingsRateChart,
  SpendingLimitGaugeChart,
  TopCategoriesChart,
} from './components/lazy-charts'
import { SummaryCards } from './components/summary-cards'
import { TimeRangeSelector } from './components/time-range-selector'
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
          {['s1', 's2', 's3', 's4'].map((key) => (
            <Skeleton key={key} className="h-32 rounded-xl" />
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
            <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
              <IncomeExpensesChart data={incomeVsExpenses!} />
            </Suspense>
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
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <ExpensesTimelineChart data={expensesTimeline} />
          </Suspense>
        </div>
        {showIncomeSection && (
          <div className="min-w-0">
            {isPro ? (
              <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
                <SavingsRateChart data={savingsRate!} />
              </Suspense>
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
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <CategoryBreakdownChart data={categoryBreakdown} />
          </Suspense>
        </div>
        <div className="min-w-0">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <PaymentBreakdownChart data={paymentBreakdown} />
          </Suspense>
        </div>
        <div className="min-w-0 md:col-span-2 lg:col-span-1">
          {isPro ? (
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <CreditCardBreakdownChart data={creditCardBreakdown!} />
            </Suspense>
          ) : (
            <ProChartLock title="Gastos por Cartão">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 px-4 md:grid-cols-2 lg:px-6">
        <div className="min-w-0">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <CreditCardUtilizationChart data={creditCardUtilization} />
          </Suspense>
        </div>
        <div className="min-w-0">
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <RecurringVsOnetimeChart data={recurringVsOnetime} />
          </Suspense>
        </div>
      </div>

      <div
        className={`grid min-w-0 gap-4 px-4 lg:px-6 ${showIncomeSection ? 'md:grid-cols-2' : ''}`}
      >
        <div className="min-w-0">
          {isPro ? (
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <TopCategoriesChart data={categoryBreakdown} />
            </Suspense>
          ) : (
            <ProChartLock title="Top Categorias">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
        {showIncomeSection && (
          <div className="min-w-0">
            {isPro ? (
              <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
                <SalaryTimelineChart data={salaryTimeline!} />
              </Suspense>
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
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <DayOfWeekChart data={dayOfWeek!} />
            </Suspense>
          ) : (
            <ProChartLock title="Gastos por Dia da Semana">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
        <div className="min-w-0">
          {isPro ? (
            <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
              <SpendingLimitGaugeChart data={spendingLimitProgress} />
            </Suspense>
          ) : (
            <ProChartLock title="Limite de Gastos">
              <div className="h-64" />
            </ProChartLock>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {isPro ? (
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <InvoiceCalendarChart data={invoiceCalendar!} />
          </Suspense>
        ) : (
          <ProChartLock title="Calendário de Faturas">
            <div className="h-64" />
          </ProChartLock>
        )}
      </div>

      <div className="px-4 lg:px-6">
        {isPro ? (
          <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
            <InstallmentForecast data={installmentForecast!} />
          </Suspense>
        ) : (
          <ProChartLock title="Previsão de Parcelas">
            <div className="h-64" />
          </ProChartLock>
        )}
      </div>
    </div>
  )
}
