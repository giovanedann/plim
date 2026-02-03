import type { Expense } from '@plim/shared'
import type { GetInstallmentGroupUseCase } from '../get-installment-group.usecase'

export async function getInstallmentGroupController(
  userId: string,
  groupId: string,
  getInstallmentGroupUseCase: GetInstallmentGroupUseCase
): Promise<Expense[]> {
  return getInstallmentGroupUseCase.execute(userId, groupId)
}
