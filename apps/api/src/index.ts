import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error-handler.middleware'
import { categoriesController } from './modules/categories/categories.controller'
import { creditCardsController } from './modules/credit-cards/credit-cards.controller'
import { dashboardController } from './modules/dashboard/dashboard.controller'
import { expensesController } from './modules/expenses/expenses.controller'
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

app.get('/', (c) => {
  return c.json({ message: 'Plim API', version: '0.0.1' })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

const api = new Hono<Env>()
api.use('*', authMiddleware)
api.route('/profile', profileController)
api.route('/categories', categoriesController)
api.route('/expenses', expensesController)
api.route('/salary', salaryController)
api.route('/spending-limits', spendingLimitsController)
api.route('/dashboard', dashboardController)
api.route('/credit-cards', creditCardsController)

app.route('/api/v1', api)

export default app
