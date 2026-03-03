import type { ExpenseForecastResponse } from '@plim/shared'
import type { GetExpenseForecastUseCase } from '../get-expense-forecast.usecase'

export async function getExpenseForecastController(
  userId: string,
  getExpenseForecastUseCase: GetExpenseForecastUseCase
): Promise<ExpenseForecastResponse> {
  return getExpenseForecastUseCase.execute(userId)
}
