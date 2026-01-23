import type { SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import type { SpendingLimitsRepository } from './spending-limits.repository'

export class UpsertSpendingLimitUseCase {
  constructor(private repository: SpendingLimitsRepository) {}

  async execute(userId: string, input: UpsertSpendingLimit): Promise<SpendingLimit | null> {
    return this.repository.upsert(userId, input)
  }
}
