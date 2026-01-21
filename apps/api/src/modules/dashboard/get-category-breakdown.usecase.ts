import type { CategoryBreakdownResponse, DashboardQuery } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetCategoryBreakdownUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<CategoryBreakdownResponse> {
    const expenses = await this.dashboardRepository.getExpensesForPeriod(userId, query)
    const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
    const data = this.dashboardRepository.aggregateByCategory(expenses, total)

    return { data, total }
  }
}
