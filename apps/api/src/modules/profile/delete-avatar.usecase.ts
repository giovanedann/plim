import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'
import type { AvatarStorage } from './upload-avatar.usecase'

export class DeleteAvatarUseCase {
  constructor(
    private profileRepository: ProfileRepository,
    private avatarStorage: AvatarStorage,
    private publicUrl: string
  ) {}

  async execute(userId: string): Promise<void> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
    }

    if (profile.avatar_url?.startsWith(this.publicUrl)) {
      const key = profile.avatar_url.replace(`${this.publicUrl}/`, '')
      try {
        await this.avatarStorage.delete(key)
      } catch {
        // Log but don't fail if R2 deletion fails — profile update is more important
      }
    }

    const updatedProfile = await this.profileRepository.update(userId, { avatar_url: null })

    if (!updatedProfile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
    }
  }
}
