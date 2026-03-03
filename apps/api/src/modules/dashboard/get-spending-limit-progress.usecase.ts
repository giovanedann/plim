import type { SpendingLimitProgressResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetSpendingLimitProgressUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string): Promise<SpendingLimitProgressResponse | null> {
    const result = await this.dashboardRepository.getSpendingLimitProgress(userId)

    if (!result) return null

    const percentage =
      result.limit_cents > 0
        ? Math.round((result.spent_cents / result.limit_cents) * 1000) / 10
        : 0

    return {
      spent_cents: result.spent_cents,
      limit_cents: result.limit_cents,
      percentage,
      days_remaining: result.days_remaining,
    }
  }
}
