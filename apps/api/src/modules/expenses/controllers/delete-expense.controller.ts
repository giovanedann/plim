import type { DeleteExpenseUseCase } from '../delete-expense.usecase'

export async function deleteExpenseController(
  userId: string,
  expenseId: string,
  deleteExpenseUseCase: DeleteExpenseUseCase
): Promise<void> {
  return deleteExpenseUseCase.execute(userId, expenseId)
}
