import type { Profile } from '@plim/shared'
import type { GetProfileUseCase } from '../get-profile.usecase'

export async function getProfileController(
  userId: string,
  getProfileUseCase: GetProfileUseCase
): Promise<Profile> {
  return getProfileUseCase.execute(userId)
}
