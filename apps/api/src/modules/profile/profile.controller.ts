import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, updateProfileSchema } from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/supabase'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { GetProfileUseCase } from './get-profile.usecase'
import { ProfileRepository } from './profile.repository'
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

export { profileController }
