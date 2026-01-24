import type { SupabaseClient } from '@supabase/supabase-js'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CreateExpenseUseCase } from './create-expense.usecase'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
import { DeleteInstallmentGroupUseCase } from './delete-installment-group.usecase'
import { ExpensesRepository } from './expenses.repository'
import { GetExpenseUseCase } from './get-expense.usecase'
import { GetInstallmentGroupUseCase } from './get-installment-group.usecase'
import { ListExpensesUseCase } from './list-expenses.usecase'
import { UpdateExpenseUseCase } from './update-expense.usecase'

export interface ExpensesDependencies {
  repository: ExpensesRepository
  listExpenses: ListExpensesUseCase
  getExpense: GetExpenseUseCase
  createExpense: CreateExpenseUseCase
  updateExpense: UpdateExpenseUseCase
  deleteExpense: DeleteExpenseUseCase
  getInstallmentGroup: GetInstallmentGroupUseCase
  deleteInstallmentGroup: DeleteInstallmentGroupUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

interface CreateDependenciesWithClientOptions {
  supabase: SupabaseClient
}

function createDependenciesFromRepository(repository: ExpensesRepository): ExpensesDependencies {
  return {
    repository,
    listExpenses: new ListExpensesUseCase(repository),
    getExpense: new GetExpenseUseCase(repository),
    createExpense: new CreateExpenseUseCase(repository),
    updateExpense: new UpdateExpenseUseCase(repository),
    deleteExpense: new DeleteExpenseUseCase(repository),
    getInstallmentGroup: new GetInstallmentGroupUseCase(repository),
    deleteInstallmentGroup: new DeleteInstallmentGroupUseCase(repository),
  }
}

/**
 * Creates all expenses module dependencies from environment and access token.
 * Use this in controllers where Hono context provides env and accessToken.
 */
export function createExpensesDependencies(
  options: CreateDependenciesOptions
): ExpensesDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new ExpensesRepository(supabase)
  return createDependenciesFromRepository(repository)
}

/**
 * Creates all expenses module dependencies from a Supabase client.
 * Use this in tests where you want to inject a mock client.
 */
export function createExpensesDependenciesWithClient(
  options: CreateDependenciesWithClientOptions
): ExpensesDependencies {
  const repository = new ExpensesRepository(options.supabase)
  return createDependenciesFromRepository(repository)
}
