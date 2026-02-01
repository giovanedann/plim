import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { DeleteAvatarUseCase } from './delete-avatar.usecase'
import { GetProfileUseCase } from './get-profile.usecase'
import { ProfileRepository } from './profile.repository'
import { UpdateProfileUseCase } from './update-profile.usecase'
import { UploadAvatarUseCase } from './upload-avatar.usecase'

export interface ProfileDependencies {
  repository: ProfileRepository
  getProfile: GetProfileUseCase
  updateProfile: UpdateProfileUseCase
  uploadAvatar: UploadAvatarUseCase
  deleteAvatar: DeleteAvatarUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createProfileDependencies(options: CreateDependenciesOptions): ProfileDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new ProfileRepository(supabase)
  return {
    repository,
    getProfile: new GetProfileUseCase(repository),
    updateProfile: new UpdateProfileUseCase(repository),
    uploadAvatar: new UploadAvatarUseCase(
      repository,
      options.env.AVATARS_BUCKET,
      options.env.R2_PUBLIC_URL
    ),
    deleteAvatar: new DeleteAvatarUseCase(
      repository,
      options.env.AVATARS_BUCKET,
      options.env.R2_PUBLIC_URL
    ),
  }
}
