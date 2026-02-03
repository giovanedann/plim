import type { DeleteAvatarUseCase } from '../delete-avatar.usecase'

export async function deleteAvatarController(
  userId: string,
  deleteAvatarUseCase: DeleteAvatarUseCase
): Promise<void> {
  return deleteAvatarUseCase.execute(userId)
}
