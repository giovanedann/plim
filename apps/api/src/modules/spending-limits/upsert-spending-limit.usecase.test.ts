import type { SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpendingLimitsRepository } from './spending-limits.repository'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

describe('UpsertSpendingLimitUseCase', () => {
  let sut: UpsertSpendingLimitUseCase
  let mockRepository: {
    upsert: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      upsert: vi.fn(),
    }
    sut = new UpsertSpendingLimitUseCase(mockRepository as unknown as SpendingLimitsRepository)
  })

  it('creates new spending limit', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-02',
      amount_cents: 500000,
    }
    const createdLimit: SpendingLimit = {
      id: 'limit-1',
      user_id: 'user-123',
      year_month: '2024-02',
      amount_cents: 500000,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    }
    mockRepository.upsert.mockResolvedValue(createdLimit)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdLimit)
    expect(mockRepository.upsert).toHaveBeenCalledWith('user-123', input)
  })

  it('updates existing spending limit', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-02',
      amount_cents: 600000,
    }
    const updatedLimit: SpendingLimit = {
      id: 'limit-1',
      user_id: 'user-123',
      year_month: '2024-02',
      amount_cents: 600000,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-15T00:00:00Z',
    }
    mockRepository.upsert.mockResolvedValue(updatedLimit)

    const result = await sut.execute('user-123', input)

    expect(result?.amount_cents).toBe(600000)
  })

  it('returns null when upsert fails', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-02',
      amount_cents: 500000,
    }
    mockRepository.upsert.mockResolvedValue(null)

    const result = await sut.execute('user-123', input)

    expect(result).toBeNull()
  })
})
