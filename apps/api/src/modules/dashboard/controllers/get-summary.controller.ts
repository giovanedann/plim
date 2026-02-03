import type { DashboardQuery, DashboardSummary } from '@plim/shared'
import type { GetSummaryUseCase } from '../get-summary.usecase'

export async function getSummaryController(
  userId: string,
  query: DashboardQuery,
  getSummaryUseCase: GetSummaryUseCase
): Promise<DashboardSummary> {
  return getSummaryUseCase.execute(userId, query)
}
