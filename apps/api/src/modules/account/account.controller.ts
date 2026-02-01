import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, deleteAccountSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { createAccountDependencies } from './account.factory'
import type { ExportableTable } from './account.repository'

type AccountEnv = {
  Bindings: Bindings
  Variables: AuthVariables
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

const accountController = new Hono<AccountEnv>()

accountController.get('/export/:table', async (c) => {
  const userId = c.get('userId')
  const table = c.req.param('table') as ExportableTable

  if (!VALID_TABLES.includes(table)) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Tabela de exportação inválida',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const { exportData } = createAccountDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const csvData = await exportData.execute(userId, table)

  const filename = `plim-${TABLE_FILENAMES[table]}-${new Date().toISOString().split('T')[0]}.csv`

  return new Response(csvData, {
    status: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})

accountController.delete('/', sValidator('json', deleteAccountSchema), async (c) => {
  const userId = c.get('userId')
  const { password } = c.req.valid('json')

  const { repository, deleteAccount } = createAccountDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const email = await repository.getUserEmail(userId)

  if (!email) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil não encontrado', HTTP_STATUS.NOT_FOUND)
  }

  await deleteAccount.execute(userId, email, password)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { accountController }
