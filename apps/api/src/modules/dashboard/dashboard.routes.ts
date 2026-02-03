import { sValidator } from '@hono/standard-validator'
import {
  HTTP_STATUS,
  dashboardQuerySchema,
  expensesTimelineQuerySchema,
  timelineGroupBySchema,
} from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { getCategoryBreakdownController } from './controllers/get-category-breakdown.controller'
import { getCreditCardBreakdownController } from './controllers/get-credit-card-breakdown.controller'
import { getDashboardController } from './controllers/get-dashboard.controller'
import { getExpensesTimelineController } from './controllers/get-expenses-timeline.controller'
import { getIncomeVsExpensesController } from './controllers/get-income-vs-expenses.controller'
import { getInstallmentForecastController } from './controllers/get-installment-forecast.controller'
import { getPaymentBreakdownController } from './controllers/get-payment-breakdown.controller'
import { getSalaryTimelineController } from './controllers/get-salary-timeline.controller'
import { getSavingsRateController } from './controllers/get-savings-rate.controller'
import { getSummaryController } from './controllers/get-summary.controller'
import { type DashboardDependencies, createDashboardDependencies } from './dashboard.factory'

export type DashboardEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { dashboardDeps: DashboardDependencies }
}

const getDashboardQuerySchema = dashboardQuerySchema.extend({
  group_by: timelineGroupBySchema.optional(),
})

export function createDashboardRouter(): Hono<DashboardEnv> {
  const router = new Hono<DashboardEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('dashboardDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', sValidator('query', getDashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getDashboardController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getDashboard
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/summary', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getSummaryController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSummary
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/expenses-timeline', sValidator('query', expensesTimelineQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getExpensesTimelineController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getExpensesTimeline
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/income-vs-expenses', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getIncomeVsExpensesController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getIncomeVsExpenses
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/category-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getCategoryBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getCategoryBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/payment-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getPaymentBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getPaymentBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/credit-card-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getCreditCardBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getCreditCardBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/savings-rate', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getSavingsRateController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSavingsRate
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/salary-timeline', sValidator('query', dashboardQuerySchema), async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getSalaryTimelineController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSalaryTimeline
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/installment-forecast', async (c) => {
    const deps = c.get('dashboardDeps')
    const result = await getInstallmentForecastController(
      c.get('userId'),
      deps.getInstallmentForecast
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createDashboardRouterWithDeps(deps: DashboardDependencies): Hono<DashboardEnv> {
  const router = new Hono<DashboardEnv>()

  router.get('/', sValidator('query', getDashboardQuerySchema), async (c) => {
    const result = await getDashboardController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getDashboard
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/summary', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getSummaryController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSummary
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/expenses-timeline', sValidator('query', expensesTimelineQuerySchema), async (c) => {
    const result = await getExpensesTimelineController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getExpensesTimeline
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/income-vs-expenses', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getIncomeVsExpensesController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getIncomeVsExpenses
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/category-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getCategoryBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getCategoryBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/payment-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getPaymentBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getPaymentBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/credit-card-breakdown', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getCreditCardBreakdownController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getCreditCardBreakdown
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/savings-rate', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getSavingsRateController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSavingsRate
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/salary-timeline', sValidator('query', dashboardQuerySchema), async (c) => {
    const result = await getSalaryTimelineController(
      c.get('userId'),
      c.req.valid('query'),
      deps.getSalaryTimeline
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.get('/installment-forecast', async (c) => {
    const result = await getInstallmentForecastController(
      c.get('userId'),
      deps.getInstallmentForecast
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

// Export default instance for production
export const dashboardRouter = createDashboardRouter()
