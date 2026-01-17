import type { SalaryHistory } from '@myfinances/shared'
import type { SalaryRepository } from './salary.repository'

export class ListSalaryHistoryUseCase {
  constructor(private salaryRepository: SalaryRepository) {}

  async execute(userId: string): Promise<SalaryHistory[]> {
    return this.salaryRepository.findAllByUserId(userId)
  }
}
