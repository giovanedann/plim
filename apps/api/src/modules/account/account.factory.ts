import {
  type Bindings,
  createSupabaseAdminClient,
  createSupabaseClientWithAuth,
} from '../../lib/env'
import { AccountRepository } from './account.repository'
import { DeleteAccountUseCase } from './delete-account.usecase'
import { ExportDataUseCase } from './export-data.usecase'

export interface AccountDependencies {
  repository: AccountRepository
  exportData: ExportDataUseCase
  deleteAccount: DeleteAccountUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createAccountDependencies(options: CreateDependenciesOptions): AccountDependencies {
  const userSupabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const adminSupabase = createSupabaseAdminClient(options.env)
  const repository = new AccountRepository(userSupabase)
  return {
    repository,
    exportData: new ExportDataUseCase(repository),
    deleteAccount: new DeleteAccountUseCase(userSupabase, adminSupabase),
  }
}
