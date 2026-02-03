import type { DashboardQuery, PaymentBreakdownResponse } from '@plim/shared'
import type { GetPaymentBreakdownUseCase } from '../get-payment-breakdown.usecase'

export async function getPaymentBreakdownController(
  userId: string,
  query: DashboardQuery,
  getPaymentBreakdownUseCase: GetPaymentBreakdownUseCase
): Promise<PaymentBreakdownResponse> {
  return getPaymentBreakdownUseCase.execute(userId, query)
}
