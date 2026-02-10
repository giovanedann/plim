import type { DashboardData, ExpensesTimelineQuery, PlanTier, TimelineGroupBy } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'
import { GetExpensesTimelineUseCase } from './get-expenses-timeline.usecase'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'
import { GetPaymentBreakdownUseCase } from './get-payment-breakdown.usecase'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'
import { GetSavingsRateUseCase } from './get-savings-rate.usecase'
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

    const [summary, expensesTimeline, categoryBreakdown, paymentBreakdown] = await Promise.all([
      this.summaryUseCase.execute(userId, dateQuery),
      this.expensesTimelineUseCase.execute(userId, timelineQuery),
      this.categoryBreakdownUseCase.execute(userId, dateQuery),
      this.paymentBreakdownUseCase.execute(userId, dateQuery),
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
      }
    }

    const [
      incomeVsExpenses,
      creditCardBreakdown,
      savingsRate,
      salaryTimeline,
      installmentForecast,
    ] = await Promise.all([
      this.incomeVsExpensesUseCase.execute(userId, dateQuery),
      this.creditCardBreakdownUseCase.execute(userId, dateQuery),
      this.savingsRateUseCase.execute(userId, dateQuery),
      this.salaryTimelineUseCase.execute(userId, dateQuery),
      this.installmentForecastUseCase.execute(userId),
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
    }
  }
}
