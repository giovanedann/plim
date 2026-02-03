import type { DashboardQuery, IncomeVsExpensesResponse } from '@plim/shared'
import type { GetIncomeVsExpensesUseCase } from '../get-income-vs-expenses.usecase'

export async function getIncomeVsExpensesController(
  userId: string,
  query: DashboardQuery,
  getIncomeVsExpensesUseCase: GetIncomeVsExpensesUseCase
): Promise<IncomeVsExpensesResponse> {
  return getIncomeVsExpensesUseCase.execute(userId, query)
}
