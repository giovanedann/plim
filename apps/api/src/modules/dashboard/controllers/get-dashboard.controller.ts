import type { DashboardData, DashboardQuery, PlanTier } from '@plim/shared'
import type { GetDashboardUseCase } from '../get-dashboard.usecase'

export async function getDashboardController(
  userId: string,
  query: DashboardQuery & { group_by?: string },
  getDashboardUseCase: GetDashboardUseCase,
  tier: PlanTier = 'pro'
): Promise<DashboardData> {
  return getDashboardUseCase.execute(userId, query, tier)
}
