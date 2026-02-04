import { sValidator } from '@hono/standard-validator'
import {
  HTTP_STATUS,
  createExpenseSchema,
  expenseFiltersSchema,
  paginatedExpenseFiltersSchema,
  updateExpenseSchema,
} from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { paginated, success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createExpenseController } from './controllers/create-expense.controller'
import { deleteExpenseController } from './controllers/delete-expense.controller'
import { deleteInstallmentGroupController } from './controllers/delete-installment-group.controller'
import { deleteRecurrentGroupController } from './controllers/delete-recurrent-group.controller'
import { getExpenseController } from './controllers/get-expense.controller'
import { getInstallmentGroupController } from './controllers/get-installment-group.controller'
import { getRecurrentGroupController } from './controllers/get-recurrent-group.controller'
import { listExpensesPaginatedController } from './controllers/list-expenses-paginated.controller'
import { listExpensesController } from './controllers/list-expenses.controller'
import { updateExpenseController } from './controllers/update-expense.controller'
import { type ExpensesDependencies, createExpensesDependencies } from './expenses.factory'

export type ExpensesEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { expensesDeps: ExpensesDependencies }
}

export function createExpensesRouter(): Hono<ExpensesEnv> {
  const router = new Hono<ExpensesEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createExpensesDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('expensesDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', sValidator('query', expenseFiltersSchema), async (c) => {
    const deps = c.get('expensesDeps')
    const result = await listExpensesController(
      c.get('userId'),
      c.req.valid('query'),
      deps.listExpenses
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/paginated', sValidator('query', paginatedExpenseFiltersSchema), async (c) => {
    const deps = c.get('expensesDeps')
    const result = await listExpensesPaginatedController(
      c.get('userId'),
      c.req.valid('query'),
      deps.listExpenses
    )
    return paginated(c, result.data, result.meta, HTTP_STATUS.OK)
  })

  router.get('/installments/:groupId', async (c) => {
    const deps = c.get('expensesDeps')
    const result = await getInstallmentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.getInstallmentGroup
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/recurrent/:groupId', async (c) => {
    const deps = c.get('expensesDeps')
    const result = await getRecurrentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.getRecurrentGroup
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/:id', async (c) => {
    const deps = c.get('expensesDeps')
    const result = await getExpenseController(c.get('userId'), c.req.param('id'), deps.getExpense)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createExpenseSchema), async (c) => {
    const deps = c.get('expensesDeps')
    const result = await createExpenseController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createExpense
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateExpenseSchema), async (c) => {
    const deps = c.get('expensesDeps')
    const result = await updateExpenseController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateExpense
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/installments/:groupId', async (c) => {
    const deps = c.get('expensesDeps')
    await deleteInstallmentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.deleteInstallmentGroup
    )
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  router.delete('/recurrent/:groupId', async (c) => {
    const deps = c.get('expensesDeps')
    await deleteRecurrentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.deleteRecurrentGroup
    )
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  router.delete('/:id', async (c) => {
    const deps = c.get('expensesDeps')
    await deleteExpenseController(c.get('userId'), c.req.param('id'), deps.deleteExpense)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createExpensesRouterWithDeps(deps: ExpensesDependencies): Hono<ExpensesEnv> {
  const router = new Hono<ExpensesEnv>()

  router.get('/', sValidator('query', expenseFiltersSchema), async (c) => {
    const result = await listExpensesController(
      c.get('userId'),
      c.req.valid('query'),
      deps.listExpenses
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/paginated', sValidator('query', paginatedExpenseFiltersSchema), async (c) => {
    const result = await listExpensesPaginatedController(
      c.get('userId'),
      c.req.valid('query'),
      deps.listExpenses
    )
    return paginated(c, result.data, result.meta, HTTP_STATUS.OK)
  })

  router.get('/installments/:groupId', async (c) => {
    const result = await getInstallmentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.getInstallmentGroup
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/recurrent/:groupId', async (c) => {
    const result = await getRecurrentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.getRecurrentGroup
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/:id', async (c) => {
    const result = await getExpenseController(c.get('userId'), c.req.param('id'), deps.getExpense)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createExpenseSchema), async (c) => {
    const result = await createExpenseController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createExpense
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateExpenseSchema), async (c) => {
    const result = await updateExpenseController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateExpense
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/installments/:groupId', async (c) => {
    await deleteInstallmentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.deleteInstallmentGroup
    )
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  router.delete('/recurrent/:groupId', async (c) => {
    await deleteRecurrentGroupController(
      c.get('userId'),
      c.req.param('groupId'),
      deps.deleteRecurrentGroup
    )
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  router.delete('/:id', async (c) => {
    await deleteExpenseController(c.get('userId'), c.req.param('id'), deps.deleteExpense)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Export default instance for production
export const expensesRouter = createExpensesRouter()
