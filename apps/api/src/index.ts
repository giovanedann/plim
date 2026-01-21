import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error-handler.middleware'
import { categoriesController } from './modules/categories/categories.controller'
import { dashboardController } from './modules/dashboard/dashboard.controller'
import { expensesController } from './modules/expenses/expenses.controller'
import { profileController } from './modules/profile/profile.controller'
import { salaryController } from './modules/salary/salary.controller'
import type { Env } from './types'

const app = new Hono<Env>()

app.use('*', cors())
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
api.route('/dashboard', dashboardController)

app.route('/api/v1', api)

export default app
