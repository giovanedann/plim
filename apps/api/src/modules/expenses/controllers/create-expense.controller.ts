import type { CreateExpense, Expense } from '@plim/shared'
import type { CreateExpenseUseCase } from '../create-expense.usecase'

export async function createExpenseController(
  userId: string,
  input: CreateExpense,
  createExpenseUseCase: CreateExpenseUseCase
): Promise<Expense | Expense[]> {
  return createExpenseUseCase.execute(userId, input)
}
