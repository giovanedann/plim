import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error-handler.middleware'
import { rateLimitMiddleware } from './middleware/rate-limit.middleware'
import { requestLoggerMiddleware } from './middleware/request-logger.middleware'
import { accountController } from './modules/account/account.controller'
import { aiRouter } from './modules/ai/ai.routes'
import { categoriesController } from './modules/categories/categories.controller'
import { creditCardsController } from './modules/credit-cards/credit-cards.controller'
import { dashboardController } from './modules/dashboard/dashboard.controller'
import { expensesRouter } from './modules/expenses/expenses.routes'
import { paymentRouter, webhookRouter } from './modules/payment/payment.routes'
import { profileController } from './modules/profile/profile.controller'
import { salaryController } from './modules/salary/salary.controller'
import { spendingLimitsController } from './modules/spending-limits/spending-limits.controller'
import type { Env } from './types'

const app = new Hono<Env>()

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = ['https://plim.app.br', 'https://www.plim.app.br']

      if (c.env.ENVIRONMENT === 'development') {
        allowedOrigins.push('http://localhost:5173')
      }

      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.onError(errorHandler)
app.use('*', requestLoggerMiddleware)

app.get('/', (c) => {
  return c.json({ message: 'Plim API', version: '0.0.1' })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

const api = new Hono<Env>()
api.use('*', rateLimitMiddleware)
api.use('*', authMiddleware)
api.route('/profile', profileController)
api.route('/categories', categoriesController)
api.route('/expenses', expensesRouter)
api.route('/salary', salaryController)
api.route('/spending-limits', spendingLimitsController)
api.route('/dashboard', dashboardController)
api.route('/credit-cards', creditCardsController)
api.route('/account', accountController)
api.route('/ai', aiRouter)
api.route('/payment', paymentRouter)

// Public webhook routes (no auth, no rate limit)
app.route('/api/v1/webhooks', webhookRouter)

app.route('/api/v1', api)

export default app
