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

export function createExpensesDependencies(
  options: CreateDependenciesOptions
): ExpensesDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new ExpensesRepository(supabase)
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
