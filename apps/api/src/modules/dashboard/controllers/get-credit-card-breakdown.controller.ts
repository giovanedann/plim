import type { CreditCardBreakdownResponse, DashboardQuery } from '@plim/shared'
import type { GetCreditCardBreakdownUseCase } from '../get-credit-card-breakdown.usecase'

export async function getCreditCardBreakdownController(
  userId: string,
  query: DashboardQuery,
  getCreditCardBreakdownUseCase: GetCreditCardBreakdownUseCase
): Promise<CreditCardBreakdownResponse> {
  return getCreditCardBreakdownUseCase.execute(userId, query)
}
