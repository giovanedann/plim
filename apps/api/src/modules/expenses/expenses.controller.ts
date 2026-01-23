import { sValidator } from '@hono/standard-validator'
import {
  HTTP_STATUS,
  createExpenseSchema,
  expenseFiltersSchema,
  updateExpenseSchema,
} from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/supabase'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { CreateExpenseUseCase } from './create-expense.usecase'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
import { DeleteInstallmentGroupUseCase } from './delete-installment-group.usecase'
import { ExpensesRepository } from './expenses.repository'
import { GetExpenseUseCase } from './get-expense.usecase'
import { GetInstallmentGroupUseCase } from './get-installment-group.usecase'
import { ListExpensesUseCase } from './list-expenses.usecase'
import { UpdateExpenseUseCase } from './update-expense.usecase'

type ExpensesEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const expensesController = new Hono<ExpensesEnv>()

expensesController.get('/', sValidator('query', expenseFiltersSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const filters = c.req.valid('query')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new ListExpensesUseCase(repository)

  const expenses = await useCase.execute(userId, filters)

  return c.json({ data: expenses }, HTTP_STATUS.OK)
})

expensesController.get('/installments/:groupId', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const groupId = c.req.param('groupId')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new GetInstallmentGroupUseCase(repository)

  const installments = await useCase.execute(userId, groupId)

  return c.json({ data: installments }, HTTP_STATUS.OK)
})

expensesController.get('/:id', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const expenseId = c.req.param('id')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new GetExpenseUseCase(repository)

  const expense = await useCase.execute(userId, expenseId)

  return c.json({ data: expense }, HTTP_STATUS.OK)
})

expensesController.post('/', sValidator('json', createExpenseSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new CreateExpenseUseCase(repository)

  const expense = await useCase.execute(userId, input)

  return c.json({ data: expense }, HTTP_STATUS.CREATED)
})

expensesController.patch('/:id', sValidator('json', updateExpenseSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const expenseId = c.req.param('id')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new UpdateExpenseUseCase(repository)

  const expense = await useCase.execute(userId, expenseId, input)

  return c.json({ data: expense }, HTTP_STATUS.OK)
})

expensesController.delete('/installments/:groupId', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const groupId = c.req.param('groupId')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new DeleteInstallmentGroupUseCase(repository)

  await useCase.execute(userId, groupId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

expensesController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const expenseId = c.req.param('id')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new ExpensesRepository(supabase)
  const useCase = new DeleteExpenseUseCase(repository)

  await useCase.execute(userId, expenseId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { expensesController }
