import type { DashboardQuery, DayOfWeekResponse } from '@plim/shared'
import type { GetDayOfWeekUseCase } from '../get-day-of-week.usecase'

export async function getDayOfWeekController(
  userId: string,
  query: DashboardQuery,
  getDayOfWeekUseCase: GetDayOfWeekUseCase
): Promise<DayOfWeekResponse> {
  return getDayOfWeekUseCase.execute(userId, query)
}
