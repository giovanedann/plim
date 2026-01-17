import { ERROR_CODES, HTTP_STATUS, type Profile, type UpdateProfile } from '@myfinances/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'

export class UpdateProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  async execute(userId: string, input: UpdateProfile): Promise<Profile> {
    const profile = await this.profileRepository.update(userId, input)

    if (!profile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
    }

    return profile
  }
}
