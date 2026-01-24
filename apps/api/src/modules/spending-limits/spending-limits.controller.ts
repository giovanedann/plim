import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, upsertSpendingLimitSchema } from '@plim/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import { SpendingLimitsRepository } from './spending-limits.repository'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

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
    const accessToken = c.get('accessToken')
    const { yearMonth } = c.req.valid('param')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new SpendingLimitsRepository(supabase)
    const useCase = new GetSpendingLimitUseCase(repository)

    const limit = await useCase.execute(userId, yearMonth)

    return c.json({ data: limit }, HTTP_STATUS.OK)
  }
)

spendingLimitsController.post('/', sValidator('json', upsertSpendingLimitSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SpendingLimitsRepository(supabase)
  const useCase = new UpsertSpendingLimitUseCase(repository)

  const limit = await useCase.execute(userId, input)

  return c.json({ data: limit }, HTTP_STATUS.CREATED)
})

export { spendingLimitsController }
