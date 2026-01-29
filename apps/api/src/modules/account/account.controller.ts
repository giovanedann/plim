import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, deleteAccountSchema } from '@plim/shared'
import { Hono } from 'hono'
import {
  type Bindings,
  createSupabaseAdminClient,
  createSupabaseClientWithAuth,
} from '../../lib/env'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { AccountRepository, type ExportableTable } from './account.repository'
import { DeleteAccountUseCase } from './delete-account.usecase'
import { ExportDataUseCase } from './export-data.usecase'

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
  const accessToken = c.get('accessToken')
  const table = c.req.param('table') as ExportableTable

  if (!VALID_TABLES.includes(table)) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Tabela de exportação inválida',
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new AccountRepository(supabase)
  const useCase = new ExportDataUseCase(repository)

  const csvData = await useCase.execute(userId, table)

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
  const accessToken = c.get('accessToken')
  const { password } = c.req.valid('json')

  const userSupabase = createSupabaseClientWithAuth(c.env, accessToken)
  const adminSupabase = createSupabaseAdminClient(c.env)
  const repository = new AccountRepository(userSupabase)

  const email = await repository.getUserEmail(userId)

  if (!email) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil não encontrado', HTTP_STATUS.NOT_FOUND)
  }

  const useCase = new DeleteAccountUseCase(userSupabase, adminSupabase)
  await useCase.execute(userId, email, password)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { accountController }
