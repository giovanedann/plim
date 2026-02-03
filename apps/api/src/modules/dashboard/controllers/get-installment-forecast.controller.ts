import type { InstallmentForecastResponse } from '@plim/shared'
import type { GetInstallmentForecastUseCase } from '../get-installment-forecast.usecase'

export async function getInstallmentForecastController(
  userId: string,
  getInstallmentForecastUseCase: GetInstallmentForecastUseCase
): Promise<InstallmentForecastResponse> {
  return getInstallmentForecastUseCase.execute(userId)
}
