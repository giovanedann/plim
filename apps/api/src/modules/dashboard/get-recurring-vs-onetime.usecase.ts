import type { DashboardQuery, RecurringVsOnetimeResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetRecurringVsOnetimeUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<RecurringVsOnetimeResponse> {
    const expenses = await this.dashboardRepository.getExpensesForPeriod(userId, query)
    const { recurring_amount, onetime_amount } =
      this.dashboardRepository.aggregateRecurringVsOnetime(expenses)

    const total = recurring_amount + onetime_amount

    return {
      recurring_amount,
      onetime_amount,
      recurring_percentage: total > 0 ? Math.round((recurring_amount / total) * 1000) / 10 : 0,
      onetime_percentage: total > 0 ? Math.round((onetime_amount / total) * 1000) / 10 : 0,
    }
  }
}
