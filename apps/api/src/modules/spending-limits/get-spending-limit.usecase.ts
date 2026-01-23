import type { EffectiveSpendingLimit } from '@plim/shared'
import type { SpendingLimitsRepository } from './spending-limits.repository'

export class GetSpendingLimitUseCase {
  constructor(private repository: SpendingLimitsRepository) {}

  async execute(userId: string, yearMonth: string): Promise<EffectiveSpendingLimit | null> {
    const explicit = await this.repository.findByMonth(userId, yearMonth)
    if (explicit) {
      return {
        year_month: explicit.year_month,
        amount_cents: explicit.amount_cents,
        is_carried_over: false,
        source_month: null,
      }
    }

    const previous = await this.repository.findMostRecentBefore(userId, yearMonth)
    if (previous) {
      return {
        year_month: yearMonth,
        amount_cents: previous.amount_cents,
        is_carried_over: true,
        source_month: previous.year_month,
      }
    }

    return null
  }
}
