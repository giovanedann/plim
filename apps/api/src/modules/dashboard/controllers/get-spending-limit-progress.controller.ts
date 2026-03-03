import type { SpendingLimitProgressResponse } from '@plim/shared'
import type { GetSpendingLimitProgressUseCase } from '../get-spending-limit-progress.usecase'

export async function getSpendingLimitProgressController(
  userId: string,
  getSpendingLimitProgressUseCase: GetSpendingLimitProgressUseCase
): Promise<SpendingLimitProgressResponse | null> {
  return getSpendingLimitProgressUseCase.execute(userId)
}
