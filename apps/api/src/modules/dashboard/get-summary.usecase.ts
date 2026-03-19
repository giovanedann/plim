import type { DashboardQuery, DashboardSummary } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetSummaryUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<DashboardSummary> {
    const [expenses, salaries, incomes] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, query),
      this.dashboardRepository.getSalariesForPeriod(userId, query),
      this.dashboardRepository.getIncomesForPeriod(userId, query),
    ])

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_cents, 0)

    const incomeExpenses = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      expenses,
      salaries,
      query.start_date,
      query.end_date,
      incomes
    )

    const totalIncome = incomeExpenses.reduce((sum, ie) => sum + ie.income, 0)
    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    const comparison = await this.calculateComparison(userId, query)

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
    query: DashboardQuery
  ): Promise<DashboardSummary['comparison']> {
    const previousQuery = this.getPreviousCalendarMonth(query)

    const [prevExpenses, prevSalaries, prevIncomes] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, previousQuery),
      this.dashboardRepository.getSalariesForPeriod(userId, previousQuery),
      this.dashboardRepository.getIncomesForPeriod(userId, previousQuery),
    ])

    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount_cents, 0)

    const prevIncomeExpenses = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      prevExpenses,
      prevSalaries,
      previousQuery.start_date,
      previousQuery.end_date,
      prevIncomes
    )

    const prevTotalIncome = prevIncomeExpenses.reduce((sum, ie) => sum + ie.income, 0)
    const prevBalance = prevTotalIncome - prevTotalExpenses

    return {
      previous_income: prevTotalIncome,
      previous_expenses: prevTotalExpenses,
      previous_balance: prevBalance,
    }
  }

  private getPreviousCalendarMonth(query: DashboardQuery): DashboardQuery {
    const [year, month] = query.start_date.split('-').map(Number) as [number, number]
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate()

    return {
      start_date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`,
      end_date: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(daysInPrevMonth).padStart(2, '0')}`,
    }
  }
}
