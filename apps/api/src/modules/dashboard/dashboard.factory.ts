import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'
import { GetCreditCardUtilizationUseCase } from './get-credit-card-utilization.usecase'
import { GetDashboardUseCase } from './get-dashboard.usecase'
import { GetDayOfWeekUseCase } from './get-day-of-week.usecase'
import { GetExpenseForecastUseCase } from './get-expense-forecast.usecase'
import { GetExpensesTimelineUseCase } from './get-expenses-timeline.usecase'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'
import { GetInvoiceCalendarUseCase } from './get-invoice-calendar.usecase'
import { GetPaymentBreakdownUseCase } from './get-payment-breakdown.usecase'
import { GetRecurringVsOnetimeUseCase } from './get-recurring-vs-onetime.usecase'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'
import { GetSavingsRateUseCase } from './get-savings-rate.usecase'
import { GetSpendingLimitProgressUseCase } from './get-spending-limit-progress.usecase'
import { GetSummaryUseCase } from './get-summary.usecase'

export interface DashboardDependencies {
  supabase: import('@supabase/supabase-js').SupabaseClient
  repository: DashboardRepository
  getDashboard: GetDashboardUseCase
  getSummary: GetSummaryUseCase
  getExpensesTimeline: GetExpensesTimelineUseCase
  getIncomeVsExpenses: GetIncomeVsExpensesUseCase
  getCategoryBreakdown: GetCategoryBreakdownUseCase
  getPaymentBreakdown: GetPaymentBreakdownUseCase
  getCreditCardBreakdown: GetCreditCardBreakdownUseCase
  getSavingsRate: GetSavingsRateUseCase
  getSalaryTimeline: GetSalaryTimelineUseCase
  getInstallmentForecast: GetInstallmentForecastUseCase
  getCreditCardUtilization: GetCreditCardUtilizationUseCase
  getRecurringVsOnetime: GetRecurringVsOnetimeUseCase
  getDayOfWeek: GetDayOfWeekUseCase
  getInvoiceCalendar: GetInvoiceCalendarUseCase
  getSpendingLimitProgress: GetSpendingLimitProgressUseCase
  getExpenseForecast: GetExpenseForecastUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createDashboardDependencies(
  options: CreateDependenciesOptions
): DashboardDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new DashboardRepository(supabase)
  return {
    supabase,
    repository,
    getDashboard: new GetDashboardUseCase(repository),
    getSummary: new GetSummaryUseCase(repository),
    getExpensesTimeline: new GetExpensesTimelineUseCase(repository),
    getIncomeVsExpenses: new GetIncomeVsExpensesUseCase(repository),
    getCategoryBreakdown: new GetCategoryBreakdownUseCase(repository),
    getPaymentBreakdown: new GetPaymentBreakdownUseCase(repository),
    getCreditCardBreakdown: new GetCreditCardBreakdownUseCase(repository),
    getSavingsRate: new GetSavingsRateUseCase(repository),
    getSalaryTimeline: new GetSalaryTimelineUseCase(repository),
    getInstallmentForecast: new GetInstallmentForecastUseCase(repository),
    getCreditCardUtilization: new GetCreditCardUtilizationUseCase(repository),
    getRecurringVsOnetime: new GetRecurringVsOnetimeUseCase(repository),
    getDayOfWeek: new GetDayOfWeekUseCase(repository),
    getInvoiceCalendar: new GetInvoiceCalendarUseCase(repository),
    getSpendingLimitProgress: new GetSpendingLimitProgressUseCase(repository),
    getExpenseForecast: new GetExpenseForecastUseCase(repository),
  }
}
