import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { CreateSalary, SalaryHistory } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { SalaryRepository } from './salary.repository'

export class CreateSalaryUseCase {
  constructor(private salaryRepository: SalaryRepository) {}

  async execute(userId: string, input: CreateSalary): Promise<SalaryHistory> {
    const salary = await this.salaryRepository.create(userId, input)

    if (!salary) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create salary record',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return salary
  }
}
