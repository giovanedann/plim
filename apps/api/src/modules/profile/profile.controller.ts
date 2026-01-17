import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { updateProfileSchema, HTTP_STATUS } from '@myfinances/shared'
import { createSupabaseClientWithAuth, type Bindings } from '../../lib/supabase'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { ProfileRepository } from './profile.repository'
import { GetProfileUseCase } from './get-profile.usecase'
import { UpdateProfileUseCase } from './update-profile.usecase'

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

profileController.patch('/', zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ProfileRepository(supabase)
  const useCase = new UpdateProfileUseCase(repository)

  const profile = await useCase.execute(userId, input)

  return c.json({ data: profile }, HTTP_STATUS.OK)
})

export { profileController }
