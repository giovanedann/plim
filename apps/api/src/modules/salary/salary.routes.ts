import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createSalarySchema, salaryQuerySchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createSalaryController } from './controllers/create-salary.controller'
import { getSalaryController } from './controllers/get-salary.controller'
import { listSalaryHistoryController } from './controllers/list-salary-history.controller'
import { type SalaryDependencies, createSalaryDependencies } from './salary.factory'

export type SalaryEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { salaryDeps: SalaryDependencies }
}

export function createSalaryRouter(): Hono<SalaryEnv> {
  const router = new Hono<SalaryEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createSalaryDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('salaryDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', sValidator('query', salaryQuerySchema), async (c) => {
    const deps = c.get('salaryDeps')
    const { month } = c.req.valid('query')
    const result = await getSalaryController(c.get('userId'), month, deps.getSalary)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/history', async (c) => {
    const deps = c.get('salaryDeps')
    const result = await listSalaryHistoryController(c.get('userId'), deps.listSalaryHistory)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createSalarySchema), async (c) => {
    const deps = c.get('salaryDeps')
    const result = await createSalaryController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createSalary
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createSalaryRouterWithDeps(deps: SalaryDependencies): Hono<SalaryEnv> {
  const router = new Hono<SalaryEnv>()

  router.get('/', sValidator('query', salaryQuerySchema), async (c) => {
    const { month } = c.req.valid('query')
    const result = await getSalaryController(c.get('userId'), month, deps.getSalary)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/history', async (c) => {
    const result = await listSalaryHistoryController(c.get('userId'), deps.listSalaryHistory)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createSalarySchema), async (c) => {
    const result = await createSalaryController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createSalary
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  return router
}

// Export default instance for production
export const salaryRouter = createSalaryRouter()
