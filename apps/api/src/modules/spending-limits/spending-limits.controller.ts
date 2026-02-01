import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, upsertSpendingLimitSchema } from '@plim/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createSpendingLimitsDependencies } from './spending-limits.factory'

type SpendingLimitsEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const yearMonthParamSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
})

const spendingLimitsController = new Hono<SpendingLimitsEnv>()

spendingLimitsController.get(
  '/:yearMonth',
  sValidator('param', yearMonthParamSchema),
  async (c) => {
    const userId = c.get('userId')
    const { yearMonth } = c.req.valid('param')

    const { getSpendingLimit } = createSpendingLimitsDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const limit = await getSpendingLimit.execute(userId, yearMonth)

    return success(c, limit, HTTP_STATUS.OK)
  }
)

spendingLimitsController.post('/', sValidator('json', upsertSpendingLimitSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { upsertSpendingLimit } = createSpendingLimitsDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const limit = await upsertSpendingLimit.execute(userId, input)

  return success(c, limit, HTTP_STATUS.CREATED)
})

export { spendingLimitsController }
