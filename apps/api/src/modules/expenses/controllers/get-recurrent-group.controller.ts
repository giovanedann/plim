import type { Expense } from '@plim/shared'
import type { GetRecurrentGroupUseCase } from '../get-recurrent-group.usecase'

export async function getRecurrentGroupController(
  userId: string,
  groupId: string,
  getRecurrentGroupUseCase: GetRecurrentGroupUseCase
): Promise<Expense[]> {
  return getRecurrentGroupUseCase.execute(userId, groupId)
}
