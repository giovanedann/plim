import type { InstallmentForecastResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetInstallmentForecastUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, months = 6): Promise<InstallmentForecastResponse> {
    const currentDate = new Date().toISOString().slice(0, 10)
    const installments = await this.dashboardRepository.getFutureInstallments(userId, currentDate)
    const data = this.dashboardRepository.calculateInstallmentForecast(installments, months)

    return { data }
  }
}
