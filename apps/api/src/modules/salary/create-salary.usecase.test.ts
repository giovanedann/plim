import { type CreateSalary, ERROR_CODES, HTTP_STATUS, type SalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateSalaryUseCase } from './create-salary.usecase'
import type { SalaryRepository } from './salary.repository'

const createdSalary: SalaryHistory = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: '22222222-2222-4222-8222-222222222222',
  amount_cents: 500000,
  effective_from: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
}

describe('CreateSalaryUseCase', () => {
  let useCase: CreateSalaryUseCase
  let mockRepository: { create: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { create: vi.fn() }
    useCase = new CreateSalaryUseCase(mockRepository as unknown as SalaryRepository)
  })

  it('creates and returns new salary record', async () => {
    const input: CreateSalary = { amount_cents: 500000, effective_from: '2024-01-01' }
    mockRepository.create.mockResolvedValue(createdSalary)

    const result = await useCase.execute('user-123', input)

    expect(result).toEqual(createdSalary)
    expect(mockRepository.create).toHaveBeenCalledWith('user-123', input)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    const input: CreateSalary = { amount_cents: 500000, effective_from: '2024-01-01' }
    mockRepository.create.mockResolvedValue(null)

    await expect(useCase.execute('user-123', input)).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', input)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
