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
import { createDashboardDependencies } from './dashboard.factory'

type DashboardEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const dashboardController = new Hono<DashboardEnv>()

const getDashboardQuerySchema = dashboardQuerySchema.extend({
  group_by: timelineGroupBySchema.optional(),
})

dashboardController.get('/', sValidator('query', getDashboardQuerySchema), async (c) => {
  const userId = c.get('userId')
  const query = c.req.valid('query')

  const { getDashboard } = createDashboardDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const data = await getDashboard.execute(userId, query)

  return success(c, data, HTTP_STATUS.OK)
})

dashboardController.get('/summary', sValidator('query', dashboardQuerySchema), async (c) => {
  const userId = c.get('userId')
  const query = c.req.valid('query')

  const { getSummary } = createDashboardDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const data = await getSummary.execute(userId, query)

  return success(c, data, HTTP_STATUS.OK)
})

dashboardController.get(
  '/expenses-timeline',
  sValidator('query', expensesTimelineQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getExpensesTimeline } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getExpensesTimeline.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/income-vs-expenses',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getIncomeVsExpenses } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getIncomeVsExpenses.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/category-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getCategoryBreakdown } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getCategoryBreakdown.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/payment-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getPaymentBreakdown } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getPaymentBreakdown.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get(
  '/credit-card-breakdown',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getCreditCardBreakdown } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getCreditCardBreakdown.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get('/savings-rate', sValidator('query', dashboardQuerySchema), async (c) => {
  const userId = c.get('userId')
  const query = c.req.valid('query')

  const { getSavingsRate } = createDashboardDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const data = await getSavingsRate.execute(userId, query)

  return success(c, data, HTTP_STATUS.OK)
})

dashboardController.get(
  '/salary-timeline',
  sValidator('query', dashboardQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const query = c.req.valid('query')

    const { getSalaryTimeline } = createDashboardDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })

    const data = await getSalaryTimeline.execute(userId, query)

    return success(c, data, HTTP_STATUS.OK)
  }
)

dashboardController.get('/installment-forecast', async (c) => {
  const userId = c.get('userId')

  const { getInstallmentForecast } = createDashboardDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const data = await getInstallmentForecast.execute(userId)

  return success(c, data, HTTP_STATUS.OK)
})

export { dashboardController }
