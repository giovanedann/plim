import type { DashboardQuery, DayOfWeekResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S\u00e1b']

export class GetDayOfWeekUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<DayOfWeekResponse> {
    const expenses = await this.dashboardRepository.getExpensesForPeriod(userId, query)
    const aggregated = this.dashboardRepository.aggregateByDayOfWeek(expenses)

    const data = aggregated.map((entry) => ({
      day_of_week: entry.day_of_week,
      label: DAY_LABELS[entry.day_of_week] ?? '',
      average_amount: entry.count > 0 ? Math.round(entry.total / entry.count) : 0,
    }))

    return { data }
  }
}
