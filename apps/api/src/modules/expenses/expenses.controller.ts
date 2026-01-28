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
import { createExpensesDependencies } from './expenses.factory'

type ExpensesEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const expensesController = new Hono<ExpensesEnv>()

expensesController.get('/', sValidator('query', expenseFiltersSchema), async (c) => {
  const userId = c.get('userId')
  const filters = c.req.valid('query')

  const { listExpenses } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const expenses = await listExpenses.execute(userId, filters)

  return success(c, expenses, HTTP_STATUS.OK)
})

expensesController.get(
  '/paginated',
  sValidator('query', paginatedExpenseFiltersSchema),
  async (c) => {
    const userId = c.get('userId')
    const filters = c.req.valid('query')

    const { listExpenses } = createExpensesDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const result = await listExpenses.executePaginated(userId, filters)

    return paginated(c, result.data, result.meta, HTTP_STATUS.OK)
  }
)

expensesController.get('/installments/:groupId', async (c) => {
  const userId = c.get('userId')
  const groupId = c.req.param('groupId')

  const { getInstallmentGroup } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const installments = await getInstallmentGroup.execute(userId, groupId)

  return success(c, installments, HTTP_STATUS.OK)
})

expensesController.get('/:id', async (c) => {
  const userId = c.get('userId')
  const expenseId = c.req.param('id')

  const { getExpense } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const expense = await getExpense.execute(userId, expenseId)

  return success(c, expense, HTTP_STATUS.OK)
})

expensesController.post('/', sValidator('json', createExpenseSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { createExpense } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const expense = await createExpense.execute(userId, input)

  return success(c, expense, HTTP_STATUS.CREATED)
})

expensesController.patch('/:id', sValidator('json', updateExpenseSchema), async (c) => {
  const userId = c.get('userId')
  const expenseId = c.req.param('id')
  const input = c.req.valid('json')

  const { updateExpense } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const expense = await updateExpense.execute(userId, expenseId, input)

  return success(c, expense, HTTP_STATUS.OK)
})

expensesController.delete('/installments/:groupId', async (c) => {
  const userId = c.get('userId')
  const groupId = c.req.param('groupId')

  const { deleteInstallmentGroup } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await deleteInstallmentGroup.execute(userId, groupId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

expensesController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const expenseId = c.req.param('id')

  const { deleteExpense } = createExpensesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await deleteExpense.execute(userId, expenseId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { expensesController }
