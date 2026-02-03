import type { DashboardData, DashboardQuery } from '@plim/shared'
import type { GetDashboardUseCase } from '../get-dashboard.usecase'

export async function getDashboardController(
  userId: string,
  query: DashboardQuery & { group_by?: string },
  getDashboardUseCase: GetDashboardUseCase
): Promise<DashboardData> {
  return getDashboardUseCase.execute(userId, query)
}
