import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetSalaryUseCase } from '../get-salary.usecase'
import { getSalaryController } from './get-salary.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('getSalaryController', () => {
  let sut: typeof getSalaryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = getSalaryController
    mockUseCase = createMockUseCase()
  })

  it('returns salary for given date', async () => {
    const effectiveDate = '2024-01-15'
    const salary = createMockSalaryHistory({
      user_id: userId,
      amount_cents: 500000,
      effective_from: '2024-01-01',
    })
    mockUseCase.execute.mockResolvedValue(salary)

    const result = await sut(userId, effectiveDate, mockUseCase as unknown as GetSalaryUseCase)

    expect(result).toEqual(salary)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, effectiveDate)
  })

  it('returns null when no salary exists for date', async () => {
    const effectiveDate = '2024-01-15'
    mockUseCase.execute.mockResolvedValue(null)

    const result = await sut(userId, effectiveDate, mockUseCase as unknown as GetSalaryUseCase)

    expect(result).toBeNull()
  })

  it('passes through use case errors', async () => {
    const effectiveDate = '2024-01-15'
    const error = new Error('Database error')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, effectiveDate, mockUseCase as unknown as GetSalaryUseCase)
    ).rejects.toThrow('Database error')
  })
})
