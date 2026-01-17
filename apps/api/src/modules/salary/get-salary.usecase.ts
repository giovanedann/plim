import type { SalaryHistory } from '@myfinances/shared'
import type { SalaryRepository } from './salary.repository'

export class GetSalaryUseCase {
  constructor(private salaryRepository: SalaryRepository) {}

  async execute(userId: string, month: string): Promise<SalaryHistory | null> {
    return this.salaryRepository.findActiveForMonth(userId, month)
  }
}
