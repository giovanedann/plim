import type { CategoryBreakdownResponse, DashboardQuery } from '@plim/shared'
import type { GetCategoryBreakdownUseCase } from '../get-category-breakdown.usecase'

export async function getCategoryBreakdownController(
  userId: string,
  query: DashboardQuery,
  getCategoryBreakdownUseCase: GetCategoryBreakdownUseCase
): Promise<CategoryBreakdownResponse> {
  return getCategoryBreakdownUseCase.execute(userId, query)
}
