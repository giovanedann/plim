import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createSalarySchema, salaryQuerySchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createSalaryDependencies } from './salary.factory'

type SalaryEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const salaryController = new Hono<SalaryEnv>()

salaryController.get('/', sValidator('query', salaryQuerySchema), async (c) => {
  const userId = c.get('userId')
  const { month } = c.req.valid('query')

  const { getSalary } = createSalaryDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const salary = await getSalary.execute(userId, month)

  return success(c, salary, HTTP_STATUS.OK)
})

salaryController.get('/history', async (c) => {
  const userId = c.get('userId')

  const { listSalaryHistory } = createSalaryDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const history = await listSalaryHistory.execute(userId)

  return success(c, history, HTTP_STATUS.OK)
})

salaryController.post('/', sValidator('json', createSalarySchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { createSalary } = createSalaryDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const salary = await createSalary.execute(userId, input)

  return success(c, salary, HTTP_STATUS.CREATED)
})

export { salaryController }
