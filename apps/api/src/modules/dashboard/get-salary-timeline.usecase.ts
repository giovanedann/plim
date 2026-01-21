import type { DashboardQuery, SalaryTimelineResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetSalaryTimelineUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<SalaryTimelineResponse> {
    const salaries = await this.dashboardRepository.getSalariesForPeriod(userId, query)
    const data = this.dashboardRepository.formatSalaryTimeline(salaries)

    return { data }
  }
}
