import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, deleteAccountSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { type AccountDependencies, createAccountDependencies } from './account.factory'
import type { ExportableTable } from './account.repository'
import { deleteAccountController } from './controllers/delete-account.controller'
import { exportDataController } from './controllers/export-data.controller'

export type AccountEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { accountDeps: AccountDependencies }
}

const VALID_TABLES: ExportableTable[] = [
  'profile',
  'expenses',
  'categories',
  'credit-cards',
  'salary-history',
]

const TABLE_FILENAMES: Record<ExportableTable, string> = {
  profile: 'perfil',
  expenses: 'despesas',
  categories: 'categorias',
  'credit-cards': 'cartoes',
  'salary-history': 'historico-salario',
}

export function createAccountRouter(): Hono<AccountEnv> {
  const router = new Hono<AccountEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createAccountDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('accountDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/export/:table', async (c) => {
    const deps = c.get('accountDeps')
    const table = c.req.param('table') as ExportableTable

    if (!VALID_TABLES.includes(table)) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'Tabela de exportação inválida',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const csvData = await exportDataController(c.get('userId'), table, deps.exportData)

    const filename = `plim-${TABLE_FILENAMES[table]}-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvData, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  })

  router.delete('/', sValidator('json', deleteAccountSchema), async (c) => {
    const deps = c.get('accountDeps')
    const { password } = c.req.valid('json')
    const userId = c.get('userId')

    if (!userId) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Usuário não autenticado',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    const email = await deps.repository.getUserEmail(userId)

    await deleteAccountController(userId, email, password, deps.deleteAccount)

    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createAccountRouterWithDeps(deps: AccountDependencies): Hono<AccountEnv> {
  const router = new Hono<AccountEnv>()

  router.get('/export/:table', async (c) => {
    const table = c.req.param('table') as ExportableTable

    if (!VALID_TABLES.includes(table)) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'Tabela de exportação inválida',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const csvData = await exportDataController(c.get('userId'), table, deps.exportData)

    const filename = `plim-${TABLE_FILENAMES[table]}-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvData, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  })

  router.delete('/', sValidator('json', deleteAccountSchema), async (c) => {
    const { password } = c.req.valid('json')
    const userId = c.get('userId')

    if (!userId) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Usuário não autenticado',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    const email = await deps.repository.getUserEmail(userId)

    await deleteAccountController(userId, email, password, deps.deleteAccount)

    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Export default instance for production
export const accountRouter = createAccountRouter()
