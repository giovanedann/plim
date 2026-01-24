import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, updateProfileSchema } from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteAvatarUseCase } from './delete-avatar.usecase'
import { GetProfileUseCase } from './get-profile.usecase'
import { ProfileRepository } from './profile.repository'
import { UpdateProfileUseCase } from './update-profile.usecase'
import { UploadAvatarUseCase } from './upload-avatar.usecase'

type ProfileEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const profileController = new Hono<ProfileEnv>()

profileController.get('/', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ProfileRepository(supabase)
  const useCase = new GetProfileUseCase(repository)

  const profile = await useCase.execute(userId)

  return c.json({ data: profile }, HTTP_STATUS.OK)
})

profileController.patch('/', sValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ProfileRepository(supabase)
  const useCase = new UpdateProfileUseCase(repository)

  const profile = await useCase.execute(userId, input)

  return c.json({ data: profile }, HTTP_STATUS.OK)
})

profileController.post('/avatar', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const formData = await c.req.formData()
  const file = formData.get('avatar')

  if (!file || typeof file === 'string') {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Avatar file is required',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ProfileRepository(supabase)
  const useCase = new UploadAvatarUseCase(repository, c.env.AVATARS_BUCKET, c.env.R2_PUBLIC_URL)

  const result = await useCase.execute(userId, file)

  return c.json({ data: result }, HTTP_STATUS.OK)
})

profileController.delete('/avatar', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ProfileRepository(supabase)
  const useCase = new DeleteAvatarUseCase(repository, c.env.AVATARS_BUCKET, c.env.R2_PUBLIC_URL)

  await useCase.execute(userId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { profileController }
