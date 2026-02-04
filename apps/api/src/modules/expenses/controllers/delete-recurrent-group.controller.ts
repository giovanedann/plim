import type { DeleteRecurrentGroupUseCase } from '../delete-recurrent-group.usecase'

export async function deleteRecurrentGroupController(
  userId: string,
  groupId: string,
  deleteRecurrentGroupUseCase: DeleteRecurrentGroupUseCase
): Promise<void> {
  return deleteRecurrentGroupUseCase.execute(userId, groupId)
}
