import type { CreateSalary, SalaryHistory } from '@plim/shared'
import type { CreateSalaryUseCase } from '../create-salary.usecase'

export async function createSalaryController(
  userId: string,
  input: CreateSalary,
  createSalaryUseCase: CreateSalaryUseCase
): Promise<SalaryHistory> {
  return createSalaryUseCase.execute(userId, input)
}
