import type { AvatarUploadResponse } from '@plim/shared'
import type { UploadAvatarUseCase } from '../upload-avatar.usecase'

export async function uploadAvatarController(
  userId: string,
  file: File,
  uploadAvatarUseCase: UploadAvatarUseCase
): Promise<AvatarUploadResponse> {
  return uploadAvatarUseCase.execute(userId, file)
}
