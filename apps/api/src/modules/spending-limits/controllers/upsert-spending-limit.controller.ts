import type { SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import type { UpsertSpendingLimitUseCase } from '../upsert-spending-limit.usecase'

export async function upsertSpendingLimitController(
  userId: string,
  input: UpsertSpendingLimit,
  upsertSpendingLimitUseCase: UpsertSpendingLimitUseCase
): Promise<SpendingLimit | null> {
  return upsertSpendingLimitUseCase.execute(userId, input)
}
