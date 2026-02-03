import type { ExpensesTimelineQuery, ExpensesTimelineResponse } from '@plim/shared'
import type { GetExpensesTimelineUseCase } from '../get-expenses-timeline.usecase'

export async function getExpensesTimelineController(
  userId: string,
  query: ExpensesTimelineQuery,
  getExpensesTimelineUseCase: GetExpensesTimelineUseCase
): Promise<ExpensesTimelineResponse> {
  return getExpensesTimelineUseCase.execute(userId, query)
}
