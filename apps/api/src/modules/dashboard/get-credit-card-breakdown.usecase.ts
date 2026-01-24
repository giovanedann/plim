import type { CreditCardBreakdownResponse, DashboardQuery } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetCreditCardBreakdownUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<CreditCardBreakdownResponse> {
    const expenses = await this.dashboardRepository.getExpensesWithCreditCards(userId, query)
    const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
    const data = this.dashboardRepository.aggregateByCreditCard(expenses, total)

    return { data, total }
  }
}
