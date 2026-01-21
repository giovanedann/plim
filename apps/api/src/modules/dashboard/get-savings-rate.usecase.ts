import type { DashboardQuery, SavingsRateResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetSavingsRateUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<SavingsRateResponse> {
    const [expenses, salaries] = await Promise.all([
      this.dashboardRepository.getExpensesForPeriod(userId, query),
      this.dashboardRepository.getSalariesForPeriod(userId, query),
    ])

    const incomeExpenses = this.dashboardRepository.calculateMonthlyIncomeExpenses(
      expenses,
      salaries,
      query.start_date,
      query.end_date
    )

    const data = this.dashboardRepository.calculateSavingsRate(incomeExpenses)

    return { data }
  }
}
