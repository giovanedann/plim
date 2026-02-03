import type { Expense, UpdateExpense } from '@plim/shared'
import type { UpdateExpenseUseCase } from '../update-expense.usecase'

export async function updateExpenseController(
  userId: string,
  expenseId: string,
  input: UpdateExpense,
  updateExpenseUseCase: UpdateExpenseUseCase
): Promise<Expense> {
  return updateExpenseUseCase.execute(userId, expenseId, input)
}
