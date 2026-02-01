import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CreateSalaryUseCase } from './create-salary.usecase'
import { GetSalaryUseCase } from './get-salary.usecase'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import { SalaryRepository } from './salary.repository'

export interface SalaryDependencies {
  repository: SalaryRepository
  getSalary: GetSalaryUseCase
  listSalaryHistory: ListSalaryHistoryUseCase
  createSalary: CreateSalaryUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createSalaryDependencies(options: CreateDependenciesOptions): SalaryDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new SalaryRepository(supabase)
  return {
    repository,
    getSalary: new GetSalaryUseCase(repository),
    listSalaryHistory: new ListSalaryHistoryUseCase(repository),
    createSalary: new CreateSalaryUseCase(repository),
  }
}
