import type { DashboardQuery, RecurringVsOnetimeResponse } from '@plim/shared'
import type { GetRecurringVsOnetimeUseCase } from '../get-recurring-vs-onetime.usecase'

export async function getRecurringVsOnetimeController(
  userId: string,
  query: DashboardQuery,
  getRecurringVsOnetimeUseCase: GetRecurringVsOnetimeUseCase
): Promise<RecurringVsOnetimeResponse> {
  return getRecurringVsOnetimeUseCase.execute(userId, query)
}
