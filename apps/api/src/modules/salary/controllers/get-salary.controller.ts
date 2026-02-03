import type { SalaryHistory } from '@plim/shared'
import type { GetSalaryUseCase } from '../get-salary.usecase'

export async function getSalaryController(
  userId: string,
  month: string,
  getSalaryUseCase: GetSalaryUseCase
): Promise<SalaryHistory | null> {
  return getSalaryUseCase.execute(userId, month)
}
