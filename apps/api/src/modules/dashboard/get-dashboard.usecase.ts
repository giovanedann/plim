import type { DashboardData, ExpensesTimelineQuery, PlanTier, TimelineGroupBy } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'
import { GetCreditCardUtilizationUseCase } from './get-credit-card-utilization.usecase'
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

export interface GetDashboardQuery {
  start_date: string
  end_date: string
  group_by?: TimelineGroupBy
}

export class GetDashboardUseCase {
  private summaryUseCase: GetSummaryUseCase
  private expensesTimelineUseCase: GetExpensesTimelineUseCase
  private incomeVsExpensesUseCase: GetIncomeVsExpensesUseCase
  private categoryBreakdownUseCase: GetCategoryBreakdownUseCase
  private paymentBreakdownUseCase: GetPaymentBreakdownUseCase
  private creditCardBreakdownUseCase: GetCreditCardBreakdownUseCase
  private savingsRateUseCase: GetSavingsRateUseCase
  private salaryTimelineUseCase: GetSalaryTimelineUseCase
  private installmentForecastUseCase: GetInstallmentForecastUseCase
  private creditCardUtilizationUseCase: GetCreditCardUtilizationUseCase
  private recurringVsOnetimeUseCase: GetRecurringVsOnetimeUseCase
  private dayOfWeekUseCase: GetDayOfWeekUseCase
  private invoiceCalendarUseCase: GetInvoiceCalendarUseCase
  private spendingLimitProgressUseCase: GetSpendingLimitProgressUseCase
  private expenseForecastUseCase: GetExpenseForecastUseCase

  constructor(repository: DashboardRepository) {
    this.summaryUseCase = new GetSummaryUseCase(repository)
    this.expensesTimelineUseCase = new GetExpensesTimelineUseCase(repository)
    this.incomeVsExpensesUseCase = new GetIncomeVsExpensesUseCase(repository)
    this.categoryBreakdownUseCase = new GetCategoryBreakdownUseCase(repository)
    this.paymentBreakdownUseCase = new GetPaymentBreakdownUseCase(repository)
    this.creditCardBreakdownUseCase = new GetCreditCardBreakdownUseCase(repository)
    this.savingsRateUseCase = new GetSavingsRateUseCase(repository)
    this.salaryTimelineUseCase = new GetSalaryTimelineUseCase(repository)
    this.installmentForecastUseCase = new GetInstallmentForecastUseCase(repository)
    this.creditCardUtilizationUseCase = new GetCreditCardUtilizationUseCase(repository)
    this.recurringVsOnetimeUseCase = new GetRecurringVsOnetimeUseCase(repository)
    this.dayOfWeekUseCase = new GetDayOfWeekUseCase(repository)
    this.invoiceCalendarUseCase = new GetInvoiceCalendarUseCase(repository)
    this.spendingLimitProgressUseCase = new GetSpendingLimitProgressUseCase(repository)
    this.expenseForecastUseCase = new GetExpenseForecastUseCase(repository)
  }

  async execute(
    userId: string,
    query: GetDashboardQuery,
    tier: PlanTier = 'pro'
  ): Promise<DashboardData> {
    const dateQuery = { start_date: query.start_date, end_date: query.end_date }
    const timelineQuery: ExpensesTimelineQuery = {
      ...dateQuery,
      group_by: query.group_by ?? 'day',
    }

    const isPro = tier === 'pro' || tier === 'unlimited'

    const [
      summary,
      expensesTimeline,
      categoryBreakdown,
      paymentBreakdown,
      creditCardUtilization,
      recurringVsOnetime,
    ] = await Promise.all([
      this.summaryUseCase.execute(userId, dateQuery),
      this.expensesTimelineUseCase.execute(userId, timelineQuery),
      this.categoryBreakdownUseCase.execute(userId, dateQuery),
      this.paymentBreakdownUseCase.execute(userId, dateQuery),
      this.creditCardUtilizationUseCase.execute(userId),
      this.recurringVsOnetimeUseCase.execute(userId, dateQuery),
    ])

    if (!isPro) {
      return {
        summary,
        expensesTimeline,
        incomeVsExpenses: null,
        categoryBreakdown,
        paymentBreakdown,
        creditCardBreakdown: null,
        savingsRate: null,
        salaryTimeline: null,
        installmentForecast: null,
        creditCardUtilization,
        recurringVsOnetime,
        dayOfWeek: null,
        invoiceCalendar: null,
        spendingLimitProgress: null,
        expenseForecast: null,
      }
    }

    const [
      incomeVsExpenses,
      creditCardBreakdown,
      savingsRate,
      salaryTimeline,
      installmentForecast,
      dayOfWeek,
      invoiceCalendar,
      spendingLimitProgress,
      expenseForecast,
    ] = await Promise.all([
      this.incomeVsExpensesUseCase.execute(userId, dateQuery),
      this.creditCardBreakdownUseCase.execute(userId, dateQuery),
      this.savingsRateUseCase.execute(userId, dateQuery),
      this.salaryTimelineUseCase.execute(userId, dateQuery),
      this.installmentForecastUseCase.execute(userId),
      this.dayOfWeekUseCase.execute(userId, dateQuery),
      this.invoiceCalendarUseCase.execute(userId),
      this.spendingLimitProgressUseCase.execute(userId),
      this.expenseForecastUseCase.execute(userId),
    ])

    return {
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
      expenseForecast,
    }
  }
}
