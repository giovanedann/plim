import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createSalarySchema, salaryQuerySchema } from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { success } from '../../lib/responses'
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

salaryController.get('/', sValidator('query', salaryQuerySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const { month } = c.req.valid('query')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new GetSalaryUseCase(repository)

  const salary = await useCase.execute(userId, month)

  return success(c, salary, HTTP_STATUS.OK)
})

salaryController.get('/history', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new ListSalaryHistoryUseCase(repository)

  const history = await useCase.execute(userId)

  return success(c, history, HTTP_STATUS.OK)
})

salaryController.post('/', sValidator('json', createSalarySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new SalaryRepository(supabase)
  const useCase = new CreateSalaryUseCase(repository)

  const salary = await useCase.execute(userId, input)

  return success(c, salary, HTTP_STATUS.CREATED)
})

export { salaryController }
