import type { CreditCardUtilizationResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetCreditCardUtilizationUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string): Promise<CreditCardUtilizationResponse> {
    const data = await this.dashboardRepository.getCreditCardUtilization(userId)
    return { data }
  }
}
