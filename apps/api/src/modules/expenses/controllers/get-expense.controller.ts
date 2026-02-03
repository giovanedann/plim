import type { Expense } from '@plim/shared'
import type { GetExpenseUseCase } from '../get-expense.usecase'

export async function getExpenseController(
  userId: string,
  expenseId: string,
  getExpenseUseCase: GetExpenseUseCase
): Promise<Expense> {
  return getExpenseUseCase.execute(userId, expenseId)
}
