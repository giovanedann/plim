import type { Expense, PaginatedExpenseFilters, PaginationMeta } from '@plim/shared'
import type { ListExpensesUseCase } from '../list-expenses.usecase'

export async function listExpensesPaginatedController(
  userId: string,
  filters: PaginatedExpenseFilters,
  listExpensesUseCase: ListExpensesUseCase
): Promise<{ data: Expense[]; meta: PaginationMeta }> {
  return listExpensesUseCase.executePaginated(userId, filters)
}
