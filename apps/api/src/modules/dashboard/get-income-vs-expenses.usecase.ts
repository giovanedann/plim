import type { DashboardQuery, IncomeVsExpensesResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetIncomeVsExpensesUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<IncomeVsExpensesResponse> {
    const [expenses, salaries, incomes] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, query),
      this.dashboardRepository.getSalariesForPeriod(userId, query),
      this.dashboardRepository.getIncomesForPeriod(userId, query),
    ])

    const data = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      expenses,
      salaries,
      query.start_date,
      query.end_date,
      incomes
    )

    return { data }
  }
}
