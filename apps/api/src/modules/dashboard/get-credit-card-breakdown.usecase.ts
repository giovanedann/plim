import type { CreditCardBreakdownResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetCreditCardBreakdownUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string): Promise<CreditCardBreakdownResponse> {
    const { expenses, total } = await this.dashboardRepository.getCreditCardBreakdownByCycle(userId)
    const data = this.dashboardRepository.aggregateByCreditCard(expenses, total)

    return { data, total }
  }
}
