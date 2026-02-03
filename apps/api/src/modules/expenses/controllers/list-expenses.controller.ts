import type { Expense, ExpenseFilters } from '@plim/shared'
import type { ListExpensesUseCase } from '../list-expenses.usecase'

export async function listExpensesController(
  userId: string,
  filters: ExpenseFilters,
  listExpensesUseCase: ListExpensesUseCase
): Promise<Expense[]> {
  return listExpensesUseCase.execute(userId, filters)
}
