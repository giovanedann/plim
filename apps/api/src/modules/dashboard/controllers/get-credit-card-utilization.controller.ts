import type { CreditCardUtilizationResponse } from '@plim/shared'
import type { GetCreditCardUtilizationUseCase } from '../get-credit-card-utilization.usecase'

export async function getCreditCardUtilizationController(
  userId: string,
  getCreditCardUtilizationUseCase: GetCreditCardUtilizationUseCase
): Promise<CreditCardUtilizationResponse> {
  return getCreditCardUtilizationUseCase.execute(userId)
}
