import { ERROR_CODES, HTTP_STATUS, type Profile } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'

export class GetProfileUseCase {
  constructor(private profileRepository: ProfileRepository) {}

  async execute(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findByUserId(userId)

    if (!profile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
    }

    return profile
  }
}
