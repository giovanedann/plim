import type { CreateSalary } from '@plim/shared'
import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateSalaryUseCase } from '../create-salary.usecase'
import { createSalaryController } from './create-salary.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('createSalaryController', () => {
  let sut: typeof createSalaryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = createSalaryController
    mockUseCase = createMockUseCase()
  })

  it('creates salary with valid input', async () => {
    const input: CreateSalary = {
      amount_cents: 500000,
      effective_from: '2024-01-01',
    }
    const salary = createMockSalaryHistory({
      user_id: userId,
      amount_cents: 500000,
      effective_from: '2024-01-01',
    })
    mockUseCase.execute.mockResolvedValue(salary)

    const result = await sut(userId, input, mockUseCase as unknown as CreateSalaryUseCase)

    expect(result).toEqual(salary)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, input)
  })

  it('passes through use case errors', async () => {
    const input: CreateSalary = {
      amount_cents: 500000,
      effective_from: '2024-01-01',
    }
    const error = new Error('Duplicate salary entry')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, input, mockUseCase as unknown as CreateSalaryUseCase)).rejects.toThrow(
      'Duplicate salary entry'
    )
  })
})
