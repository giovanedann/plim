import type { DeleteInstallmentGroupUseCase } from '../delete-installment-group.usecase'

export async function deleteInstallmentGroupController(
  userId: string,
  groupId: string,
  deleteInstallmentGroupUseCase: DeleteInstallmentGroupUseCase
): Promise<void> {
  return deleteInstallmentGroupUseCase.execute(userId, groupId)
}
