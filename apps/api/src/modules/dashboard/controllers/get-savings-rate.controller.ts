import type { DashboardQuery, SavingsRateResponse } from '@plim/shared'
import type { GetSavingsRateUseCase } from '../get-savings-rate.usecase'

export async function getSavingsRateController(
  userId: string,
  query: DashboardQuery,
  getSavingsRateUseCase: GetSavingsRateUseCase
): Promise<SavingsRateResponse> {
  return getSavingsRateUseCase.execute(userId, query)
}
