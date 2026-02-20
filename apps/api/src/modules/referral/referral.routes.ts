import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { type ReferralDependencies, createReferralDependencies } from './referral.factory'

type ReferralPublicEnv = {
  Bindings: Bindings
}

type ReferralEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { referralDeps: ReferralDependencies }
}

export function createReferralPublicRouter(): Hono<ReferralPublicEnv> {
  const router = new Hono<ReferralPublicEnv>()

  router.get('/validate/:code', async (c) => {
    const code = c.req.param('code')

    const deps = createReferralDependencies({
      env: c.env,
      accessToken: '',
    })

    const result = await deps.validateReferralCode.execute(code)
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export function createReferralRouter(): Hono<ReferralEnv> {
  const router = new Hono<ReferralEnv>()

  router.use('*', async (c, next) => {
    const deps = createReferralDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('referralDeps', deps)
    await next()
  })

  router.get('/stats', async (c) => {
    const deps = c.get('referralDeps')
    const userId = c.get('userId')

    const result = await deps.getReferralStats.execute(userId)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/claim', async (c) => {
    const deps = c.get('referralDeps')
    const userId = c.get('userId')

    const body = (await c.req.json()) as { referral_code?: string }

    if (!body.referral_code) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'referral_code is required',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await deps.claimReferral.execute(userId, {
      referral_code: body.referral_code,
    })
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export function createReferralPublicRouterWithDeps(
  deps: ReferralDependencies
): Hono<ReferralPublicEnv> {
  const router = new Hono<ReferralPublicEnv>()

  router.get('/validate/:code', async (c) => {
    const code = c.req.param('code')
    const result = await deps.validateReferralCode.execute(code)
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export function createReferralRouterWithDeps(deps: ReferralDependencies): Hono<ReferralEnv> {
  const router = new Hono<ReferralEnv>()

  router.get('/stats', async (c) => {
    const userId = c.get('userId')
    const result = await deps.getReferralStats.execute(userId)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/claim', async (c) => {
    const userId = c.get('userId')
    const body = (await c.req.json()) as { referral_code?: string }

    if (!body.referral_code) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'referral_code is required',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const result = await deps.claimReferral.execute(userId, {
      referral_code: body.referral_code,
    })
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export const referralPublicRouter = createReferralPublicRouter()
export const referralRouter = createReferralRouter()
