import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, upsertSpendingLimitSchema } from '@plim/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { getSpendingLimitController } from './controllers/get-spending-limit.controller'
import { upsertSpendingLimitController } from './controllers/upsert-spending-limit.controller'
import {
  type SpendingLimitsDependencies,
  createSpendingLimitsDependencies,
} from './spending-limits.factory'

export type SpendingLimitsEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { spendingLimitsDeps: SpendingLimitsDependencies }
}

const yearMonthParamSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
})

export function createSpendingLimitsRouter(): Hono<SpendingLimitsEnv> {
  const router = new Hono<SpendingLimitsEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createSpendingLimitsDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('spendingLimitsDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/:yearMonth', sValidator('param', yearMonthParamSchema), async (c) => {
    const deps = c.get('spendingLimitsDeps')
    const { yearMonth } = c.req.valid('param')
    const result = await getSpendingLimitController(
      c.get('userId'),
      yearMonth,
      deps.getSpendingLimit
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', upsertSpendingLimitSchema), async (c) => {
    const deps = c.get('spendingLimitsDeps')
    const result = await upsertSpendingLimitController(
      c.get('userId'),
      c.req.valid('json'),
      deps.upsertSpendingLimit
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createSpendingLimitsRouterWithDeps(
  deps: SpendingLimitsDependencies
): Hono<SpendingLimitsEnv> {
  const router = new Hono<SpendingLimitsEnv>()

  router.get('/:yearMonth', sValidator('param', yearMonthParamSchema), async (c) => {
    const { yearMonth } = c.req.valid('param')
    const result = await getSpendingLimitController(
      c.get('userId'),
      yearMonth,
      deps.getSpendingLimit
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', upsertSpendingLimitSchema), async (c) => {
    const result = await upsertSpendingLimitController(
      c.get('userId'),
      c.req.valid('json'),
      deps.upsertSpendingLimit
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  return router
}

// Export default instance for production
export const spendingLimitsRouter = createSpendingLimitsRouter()
