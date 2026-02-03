import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, updateProfileSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { deleteAvatarController } from './controllers/delete-avatar.controller'
import { getProfileController } from './controllers/get-profile.controller'
import { updateProfileController } from './controllers/update-profile.controller'
import { uploadAvatarController } from './controllers/upload-avatar.controller'
import { type ProfileDependencies, createProfileDependencies } from './profile.factory'

export type ProfileEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { profileDeps: ProfileDependencies }
}

export function createProfileRouter(): Hono<ProfileEnv> {
  const router = new Hono<ProfileEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createProfileDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('profileDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', async (c) => {
    const deps = c.get('profileDeps')
    const result = await getProfileController(c.get('userId'), deps.getProfile)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.patch('/', sValidator('json', updateProfileSchema), async (c) => {
    const deps = c.get('profileDeps')
    const result = await updateProfileController(
      c.get('userId'),
      c.req.valid('json'),
      deps.updateProfile
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/avatar', async (c) => {
    const deps = c.get('profileDeps')

    const formData = await c.req.formData()
    const file = formData.get('avatar')

    if (!file || typeof file === 'string') {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'Avatar file is required',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await uploadAvatarController(c.get('userId'), file, deps.uploadAvatar)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/avatar', async (c) => {
    const deps = c.get('profileDeps')
    await deleteAvatarController(c.get('userId'), deps.deleteAvatar)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createProfileRouterWithDeps(deps: ProfileDependencies): Hono<ProfileEnv> {
  const router = new Hono<ProfileEnv>()

  router.get('/', async (c) => {
    const result = await getProfileController(c.get('userId'), deps.getProfile)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.patch('/', sValidator('json', updateProfileSchema), async (c) => {
    const result = await updateProfileController(
      c.get('userId'),
      c.req.valid('json'),
      deps.updateProfile
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/avatar', async (c) => {
    const formData = await c.req.formData()
    const file = formData.get('avatar')

    if (!file || typeof file === 'string') {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'Avatar file is required',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await uploadAvatarController(c.get('userId'), file, deps.uploadAvatar)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/avatar', async (c) => {
    await deleteAvatarController(c.get('userId'), deps.deleteAvatar)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Export default instance for production
export const profileRouter = createProfileRouter()
