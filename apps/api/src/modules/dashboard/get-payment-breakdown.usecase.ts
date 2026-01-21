import type { DashboardQuery, PaymentBreakdownResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetPaymentBreakdownUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string, query: DashboardQuery): Promise<PaymentBreakdownResponse> {
    const expenses = await this.dashboardRepository.getExpensesForPeriod(userId, query)
    const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
    const data = this.dashboardRepository.aggregateByPaymentMethod(expenses, total)

    return { data, total }
  }
}
