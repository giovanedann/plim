import type { InstallmentForecastResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetInstallmentForecastUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, months = 6): Promise<InstallmentForecastResponse> {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startDate = nextMonth.toISOString().slice(0, 10)
    const expenses = await this.dashboardRepository.getFutureExpenses(userId, startDate, months)
    const data = this.dashboardRepository.calculateInstallmentForecast(expenses, months)

    return { data }
  }
}
