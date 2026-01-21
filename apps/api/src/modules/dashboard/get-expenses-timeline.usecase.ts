import type { ExpensesTimelineQuery, ExpensesTimelineResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetExpensesTimelineUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: ExpensesTimelineQuery): Promise<ExpensesTimelineResponse> {
    const expenses = await this.dashboardRepository.getExpensesForPeriod(userId, {
      start_date: query.start_date,
      end_date: query.end_date,
    })

    const data = this.dashboardRepository.aggregateExpensesByTimeline(expenses, query.group_by)

    return {
      data,
      group_by: query.group_by,
    }
  }
}
