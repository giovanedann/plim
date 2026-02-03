import { createMockSpendingLimit } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import type { SpendingLimitsRepository } from './spending-limits.repository'

type MockRepository = {
  findByMonth: ReturnType<typeof vi.fn>
  findMostRecentBefore: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByMonth: vi.fn(),
    findMostRecentBefore: vi.fn(),
  }
}

describe('GetSpendingLimitUseCase', () => {
  let sut: GetSpendingLimitUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetSpendingLimitUseCase(mockRepository as unknown as SpendingLimitsRepository)
  })

  it('returns explicit limit for the month', async () => {
    const explicitLimit = createMockSpendingLimit({
      year_month: '2024-02',
      amount_cents: 500000,
    })
    mockRepository.findByMonth.mockResolvedValue(explicitLimit)

    const result = await sut.execute('user-123', '2024-02')

    expect(result).toEqual({
      year_month: '2024-02',
      amount_cents: 500000,
      is_carried_over: false,
      source_month: null,
    })
  })

  it('returns carried-over limit when no explicit limit exists', async () => {
    const previousLimit = createMockSpendingLimit({
      year_month: '2024-01',
      amount_cents: 450000,
    })
    mockRepository.findByMonth.mockResolvedValue(null)
    mockRepository.findMostRecentBefore.mockResolvedValue(previousLimit)

    const result = await sut.execute('user-123', '2024-03')

    expect(result).toEqual({
      year_month: '2024-03',
      amount_cents: 450000,
      is_carried_over: true,
      source_month: '2024-01',
    })
  })

  it('returns null when no limits exist', async () => {
    mockRepository.findByMonth.mockResolvedValue(null)
    mockRepository.findMostRecentBefore.mockResolvedValue(null)

    const result = await sut.execute('user-123', '2024-01')

    expect(result).toBeNull()
  })

  it('prefers explicit limit over carried-over limit', async () => {
    const explicitLimit = createMockSpendingLimit({
      year_month: '2024-02',
      amount_cents: 600000,
    })
    mockRepository.findByMonth.mockResolvedValue(explicitLimit)

    const result = await sut.execute('user-123', '2024-02')

    expect(result?.is_carried_over).toBe(false)
    expect(result?.amount_cents).toBe(600000)
  })

  describe('boundary cases', () => {
    it('handles minimum amount (1 cent)', async () => {
      const limit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 1,
      })
      mockRepository.findByMonth.mockResolvedValue(limit)

      const result = await sut.execute('user-123', '2024-01')

      expect(result?.amount_cents).toBe(1)
    })

    it('handles large spending limit', async () => {
      const limit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 999_999_99,
      })
      mockRepository.findByMonth.mockResolvedValue(limit)

      const result = await sut.execute('user-123', '2024-01')

      expect(result?.amount_cents).toBe(999_999_99)
    })

    it('handles year boundary carryover (December to January)', async () => {
      const decemberLimit = createMockSpendingLimit({
        year_month: '2023-12',
        amount_cents: 300000,
      })
      mockRepository.findByMonth.mockResolvedValue(null)
      mockRepository.findMostRecentBefore.mockResolvedValue(decemberLimit)

      const result = await sut.execute('user-123', '2024-01')

      expect(result).toEqual({
        year_month: '2024-01',
        amount_cents: 300000,
        is_carried_over: true,
        source_month: '2023-12',
      })
    })

    it('handles far future month with carryover', async () => {
      const currentLimit = createMockSpendingLimit({
        year_month: '2024-01',
        amount_cents: 400000,
      })
      mockRepository.findByMonth.mockResolvedValue(null)
      mockRepository.findMostRecentBefore.mockResolvedValue(currentLimit)

      const result = await sut.execute('user-123', '2030-12')

      expect(result?.is_carried_over).toBe(true)
      expect(result?.source_month).toBe('2024-01')
    })
  })
})
