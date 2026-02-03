import type { DashboardQuery, SalaryTimelineResponse } from '@plim/shared'
import type { GetSalaryTimelineUseCase } from '../get-salary-timeline.usecase'

export async function getSalaryTimelineController(
  userId: string,
  query: DashboardQuery,
  getSalaryTimelineUseCase: GetSalaryTimelineUseCase
): Promise<SalaryTimelineResponse> {
  return getSalaryTimelineUseCase.execute(userId, query)
}
