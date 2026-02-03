import type { UpsertSpendingLimit } from '@plim/shared'
import { createMockSpendingLimit } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpendingLimitsRepository } from './spending-limits.repository'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

type MockRepository = {
  upsert: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    upsert: vi.fn(),
  }
}

describe('UpsertSpendingLimitUseCase', () => {
  let sut: UpsertSpendingLimitUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new UpsertSpendingLimitUseCase(mockRepository as unknown as SpendingLimitsRepository)
  })

  it('creates new spending limit', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-02',
      amount_cents: 500000,
    }
    const createdLimit = createMockSpendingLimit({
      year_month: '2024-02',
      amount_cents: 500000,
    })
    mockRepository.upsert.mockResolvedValue(createdLimit)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdLimit)
  })

  it('updates existing spending limit', async () => {
    const input: UpsertSpendingLimit = {
      year_month: '2024-02',
      amount_cents: 600000,
    }
    const updatedLimit = createMockSpendingLimit({
      year_month: '2024-02',
      amount_cents: 600000,
    })
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

  describe('boundary cases', () => {
    it('handles minimum amount (1 cent)', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2024-01',
        amount_cents: 1,
      }
      const limit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 1,
      })
      mockRepository.upsert.mockResolvedValue(limit)

      const result = await sut.execute('user-123', input)

      expect(result?.amount_cents).toBe(1)
    })

    it('handles large spending limit', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2024-01',
        amount_cents: 999_999_99,
      }
      const limit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 999_999_99,
      })
      mockRepository.upsert.mockResolvedValue(limit)

      const result = await sut.execute('user-123', input)

      expect(result?.amount_cents).toBe(999_999_99)
    })

    it('handles year boundary (January)', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2024-01',
        amount_cents: 400000,
      }
      const limit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 400000,
      })
      mockRepository.upsert.mockResolvedValue(limit)

      const result = await sut.execute('user-123', input)

      expect(result?.year_month).toBe('2024-01')
    })

    it('handles year boundary (December)', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2024-12',
        amount_cents: 600000,
      }
      const limit = createMockSpendingLimit({
        year_month: '2024-12',
        amount_cents: 600000,
      })
      mockRepository.upsert.mockResolvedValue(limit)

      const result = await sut.execute('user-123', input)

      expect(result?.year_month).toBe('2024-12')
    })
  })
})
