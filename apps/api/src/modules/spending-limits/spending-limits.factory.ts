import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import { SpendingLimitsRepository } from './spending-limits.repository'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

export interface SpendingLimitsDependencies {
  repository: SpendingLimitsRepository
  getSpendingLimit: GetSpendingLimitUseCase
  upsertSpendingLimit: UpsertSpendingLimitUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createSpendingLimitsDependencies(
  options: CreateDependenciesOptions
): SpendingLimitsDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new SpendingLimitsRepository(supabase)
  return {
    repository,
    getSpendingLimit: new GetSpendingLimitUseCase(repository),
    upsertSpendingLimit: new UpsertSpendingLimitUseCase(repository),
  }
}
