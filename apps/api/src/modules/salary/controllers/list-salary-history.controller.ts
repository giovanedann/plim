import type { SalaryHistory } from '@plim/shared'
import type { ListSalaryHistoryUseCase } from '../list-salary-history.usecase'

export async function listSalaryHistoryController(
  userId: string,
  listSalaryHistoryUseCase: ListSalaryHistoryUseCase
): Promise<SalaryHistory[]> {
  return listSalaryHistoryUseCase.execute(userId)
}
