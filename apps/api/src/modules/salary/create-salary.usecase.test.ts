import { type CreateSalary, ERROR_CODES, HTTP_STATUS, createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateSalaryUseCase } from './create-salary.usecase'
import type { SalaryRepository } from './salary.repository'

type MockRepository = {
  create: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    create: vi.fn(),
  }
}

describe('CreateSalaryUseCase', () => {
  let sut: CreateSalaryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new CreateSalaryUseCase(mockRepository as unknown as SalaryRepository)
  })

  it('creates and returns new salary record', async () => {
    const input: CreateSalary = { amount_cents: 500000, effective_from: '2024-01-01' }
    const createdSalary = createMockSalaryHistory({
      amount_cents: 500000,
      effective_from: '2024-01-01',
    })
    mockRepository.create.mockResolvedValue(createdSalary)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdSalary)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    const input: CreateSalary = { amount_cents: 500000, effective_from: '2024-01-01' }
    mockRepository.create.mockResolvedValue(null)

    await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', input)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary cases', () => {
    it('handles minimum salary value', async () => {
      const input: CreateSalary = { amount_cents: 1, effective_from: '2024-01-01' }
      const salary = createMockSalaryHistory({ amount_cents: 1 })
      mockRepository.create.mockResolvedValue(salary)

      const result = await sut.execute('user-123', input)

      expect(result.amount_cents).toBe(1)
    })

    it('handles large salary value', async () => {
      const input: CreateSalary = { amount_cents: 999_999_999_99, effective_from: '2024-01-01' }
      const salary = createMockSalaryHistory({ amount_cents: 999_999_999_99 })
      mockRepository.create.mockResolvedValue(salary)

      const result = await sut.execute('user-123', input)

      expect(result.amount_cents).toBe(999_999_999_99)
    })

    it('handles future effective date', async () => {
      const futureDate = '2030-01-01'
      const input: CreateSalary = { amount_cents: 500000, effective_from: futureDate }
      const salary = createMockSalaryHistory({ effective_from: futureDate })
      mockRepository.create.mockResolvedValue(salary)

      const result = await sut.execute('user-123', input)

      expect(result.effective_from).toBe(futureDate)
    })
  })
})
