import type { UpsertSpendingLimit } from '@plim/shared'
import { createMockSpendingLimit } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpsertSpendingLimitUseCase } from '../upsert-spending-limit.usecase'
import { upsertSpendingLimitController } from './upsert-spending-limit.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('upsertSpendingLimitController', () => {
  let sut: typeof upsertSpendingLimitController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = upsertSpendingLimitController
    mockUseCase = createMockUseCase()
  })

  it('upserts spending limit with valid input', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-01',
      amount_cents: 300000,
    }
    const limit = createMockSpendingLimit({
      user_id: userId,
      year_month: '2024-01',
      amount_cents: 300000,
    })
    mockUseCase.execute.mockResolvedValue(limit)

    const result = await sut(userId, input, mockUseCase as unknown as UpsertSpendingLimitUseCase)

    expect(result).toEqual(limit)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, input)
  })

  it('returns null when use case returns null', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-01',
      amount_cents: 100,
    }
    mockUseCase.execute.mockResolvedValue(null)

    const result = await sut(userId, input, mockUseCase as unknown as UpsertSpendingLimitUseCase)

    expect(result).toBeNull()
  })

  it('passes through use case errors', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-01',
      amount_cents: 300000,
    }
    const error = new Error('Update failed')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, input, mockUseCase as unknown as UpsertSpendingLimitUseCase)
    ).rejects.toThrow('Update failed')
  })
})
