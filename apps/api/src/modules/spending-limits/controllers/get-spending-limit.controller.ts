import type { EffectiveSpendingLimit } from '@plim/shared'
import type { GetSpendingLimitUseCase } from '../get-spending-limit.usecase'

export async function getSpendingLimitController(
  userId: string,
  yearMonth: string,
  getSpendingLimitUseCase: GetSpendingLimitUseCase
): Promise<EffectiveSpendingLimit | null> {
  return getSpendingLimitUseCase.execute(userId, yearMonth)
}
