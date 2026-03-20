import type { CreditCardBreakdownResponse } from '@plim/shared'
import type { GetCreditCardBreakdownUseCase } from '../get-credit-card-breakdown.usecase'

export async function getCreditCardBreakdownController(
  userId: string,
  getCreditCardBreakdownUseCase: GetCreditCardBreakdownUseCase
): Promise<CreditCardBreakdownResponse> {
  return getCreditCardBreakdownUseCase.execute(userId)
}
