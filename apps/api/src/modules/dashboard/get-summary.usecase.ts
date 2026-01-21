import type { DashboardQuery, DashboardSummary } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetSummaryUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<DashboardSummary> {
    const [expenses, salaries] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, query),
      this.dashboardRepository.getSalariesForPeriod(userId, query),
    ])

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_cents, 0)

    const incomeExpenses = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      expenses,
      salaries,
      query.start_date,
      query.end_date
    )

    const totalIncome = incomeExpenses.reduce((sum, ie) => sum + ie.income, 0)
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    const comparison = await this.calculateComparison(
      userId,
      query,
      totalIncome,
      totalExpenses,
      balance
    )

    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      balance,
      savings_rate: Math.round(savingsRate * 100) / 100,
      comparison,
    }
  }

  private async calculateComparison(
    userId: string,
    query: DashboardQuery,
    currentIncome: number,
    currentExpenses: number,
    currentBalance: number
  ): Promise<DashboardSummary['comparison']> {
    const periodDays = this.daysBetween(query.start_date, query.end_date)
    const previousQuery = this.getPreviousPeriod(query, periodDays)

    const [prevExpenses, prevSalaries] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, previousQuery),
      this.dashboardRepository.getSalariesForPeriod(userId, previousQuery),
    ])

    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount_cents, 0)

    const prevIncomeExpenses = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      prevExpenses,
      prevSalaries,
      previousQuery.start_date,
      previousQuery.end_date
    )

    const prevTotalIncome = prevIncomeExpenses.reduce((sum, ie) => sum + ie.income, 0)
    const prevBalance = prevTotalIncome - prevTotalExpenses

    return {
      income_change_percent: this.percentChange(prevTotalIncome, currentIncome),
      expenses_change_percent: this.percentChange(prevTotalExpenses, currentExpenses),
      balance_change_percent: this.percentChange(prevBalance, currentBalance),
    }
  }

  private daysBetween(start: string, end: string): number {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  private getPreviousPeriod(query: DashboardQuery, days: number): DashboardQuery {
    const endDate = new Date(query.start_date)
    endDate.setDate(endDate.getDate() - 1)

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days + 1)

    return {
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
    }
  }

  private percentChange(previous: number, current: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100
    }
    const change = ((current - previous) / Math.abs(previous)) * 100
    return Math.round(change * 100) / 100
  }
}
