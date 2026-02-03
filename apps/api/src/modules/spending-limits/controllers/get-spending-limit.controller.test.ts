import { createMockSpendingLimit } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetSpendingLimitUseCase } from '../get-spending-limit.usecase'
import { getSpendingLimitController } from './get-spending-limit.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('getSpendingLimitController', () => {
  let sut: typeof getSpendingLimitController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = getSpendingLimitController
    mockUseCase = createMockUseCase()
  })

  it('returns spending limit for given month', async () => {
    const yearMonth = '2024-01'
    const limit = createMockSpendingLimit({
      user_id: userId,
      year_month: '2024-01',
      amount_cents: 300000,
    })
    mockUseCase.execute.mockResolvedValue(limit)

    const result = await sut(userId, yearMonth, mockUseCase as unknown as GetSpendingLimitUseCase)

    expect(result).toEqual(limit)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, yearMonth)
  })

  it('returns null when no limit exists', async () => {
    const yearMonth = '2024-01'
    mockUseCase.execute.mockResolvedValue(null)

    const result = await sut(userId, yearMonth, mockUseCase as unknown as GetSpendingLimitUseCase)

    expect(result).toBeNull()
  })

  it('passes through use case errors', async () => {
    const yearMonth = '2024-01'
    const error = new Error('Database error')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, yearMonth, mockUseCase as unknown as GetSpendingLimitUseCase)
    ).rejects.toThrow('Database error')
  })
})
