import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, updateProfileSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { createProfileDependencies } from './profile.factory'

type ProfileEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const profileController = new Hono<ProfileEnv>()

profileController.get('/', async (c) => {
  const userId = c.get('userId')

  const { getProfile } = createProfileDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const profile = await getProfile.execute(userId)

  return success(c, profile, HTTP_STATUS.OK)
})

profileController.patch('/', sValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { updateProfile } = createProfileDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const profile = await updateProfile.execute(userId, input)

  return success(c, profile, HTTP_STATUS.OK)
})

profileController.post('/avatar', async (c) => {
  const userId = c.get('userId')

  const formData = await c.req.formData()
  const file = formData.get('avatar')

  if (!file || typeof file === 'string') {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Avatar file is required',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const { uploadAvatar } = createProfileDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const result = await uploadAvatar.execute(userId, file)

  return success(c, result, HTTP_STATUS.OK)
})

profileController.delete('/avatar', async (c) => {
  const userId = c.get('userId')

  const { deleteAvatar } = createProfileDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await deleteAvatar.execute(userId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { profileController }
