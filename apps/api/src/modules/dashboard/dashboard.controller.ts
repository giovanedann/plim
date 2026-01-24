import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, dashboardQuerySchema, expensesTimelineQuerySchema } from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'
import { GetExpensesTimelineUseCase } from './get-expenses-timeline.usecase'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'
import { GetPaymentBreakdownUseCase } from './get-payment-breakdown.usecase'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'
import { GetSavingsRateUseCase } from './get-savings-rate.usecase'
import { GetSummaryUseCase } from './get-summary.usecase'

type DashboardEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const dashboardController = new Hono<DashboardEnv>()

dashboardController.get('/summary', sValidator('query', dashboardQuerySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const query = c.req.valid('query')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new DashboardRepository(supabase)
  const useCase = new GetSummaryUseCase(repository)

  const data = await useCase.execute(userId, query)

  return c.json({ data }, HTTP_STATUS.OK)
})

dashboardController.get(
  '/expenses-timeline',
  sValidator('query', expensesTimelineQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetExpensesTimelineUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/income-vs-expenses',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetIncomeVsExpensesUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/category-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetCategoryBreakdownUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/payment-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetPaymentBreakdownUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/credit-card-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetCreditCardBreakdownUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get('/savings-rate', sValidator('query', dashboardQuerySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const query = c.req.valid('query')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new DashboardRepository(supabase)
  const useCase = new GetSavingsRateUseCase(repository)

  const data = await useCase.execute(userId, query)

  return c.json({ data }, HTTP_STATUS.OK)
})

dashboardController.get(
  '/salary-timeline',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const accessToken = c.get('accessToken')
    const query = c.req.valid('query')

    const supabase = createSupabaseClientWithAuth(c.env, accessToken)
    const repository = new DashboardRepository(supabase)
    const useCase = new GetSalaryTimelineUseCase(repository)

    const data = await useCase.execute(userId, query)

    return c.json({ data }, HTTP_STATUS.OK)
  }
)

dashboardController.get('/installment-forecast', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new DashboardRepository(supabase)
  const useCase = new GetInstallmentForecastUseCase(repository)

  const data = await useCase.execute(userId)

  return c.json({ data }, HTTP_STATUS.OK)
})

export { dashboardController }
