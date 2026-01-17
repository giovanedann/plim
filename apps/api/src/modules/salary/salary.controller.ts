import { zValidator } from '@hono/zod-validator'
import { HTTP_STATUS, createSalarySchema, salaryQuerySchema } from '@myfinances/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/supabase'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { CreateSalaryUseCase } from './create-salary.usecase'
import { GetSalaryUseCase } from './get-salary.usecase'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import { SalaryRepository } from './salary.repository'

type SalaryEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const salaryController = new Hono<SalaryEnv>()

salaryController.get('/', zValidator('query', salaryQuerySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const { month } = c.req.valid('query')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new GetSalaryUseCase(repository)

  const salary = await useCase.execute(userId, month)

  return c.json({ data: salary }, HTTP_STATUS.OK)
})

salaryController.get('/history', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new ListSalaryHistoryUseCase(repository)

  const history = await useCase.execute(userId)

  return c.json({ data: history }, HTTP_STATUS.OK)
})

salaryController.post('/', zValidator('json', createSalarySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new CreateSalaryUseCase(repository)

  const salary = await useCase.execute(userId, input)

  return c.json({ data: salary }, HTTP_STATUS.CREATED)
})

export { salaryController }
