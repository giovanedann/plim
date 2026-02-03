import type { Profile, UpdateProfile } from '@plim/shared'
import type { UpdateProfileUseCase } from '../update-profile.usecase'

export async function updateProfileController(
  userId: string,
  input: UpdateProfile,
  updateProfileUseCase: UpdateProfileUseCase
): Promise<Profile> {
  return updateProfileUseCase.execute(userId, input)
}
