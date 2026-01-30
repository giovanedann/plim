import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import type { SpendingLimitsRepository } from './spending-limits.repository'

describe('GetSpendingLimitUseCase', () => {
  let sut: GetSpendingLimitUseCase
  let mockRepository: {
    findByMonth: ReturnType<typeof vi.fn>
    findMostRecentBefore: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findByMonth: vi.fn(),
      findMostRecentBefore: vi.fn(),
    }
    sut = new GetSpendingLimitUseCase(mockRepository as unknown as SpendingLimitsRepository)
  })

  it('returns explicit limit for the month', async () => {
    const explicitLimit = {
      id: 'limit-1',
      user_id: 'user-123',
      year_month: '2024-02',
      amount_cents: 500000,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    }
    mockRepository.findByMonth.mockResolvedValue(explicitLimit)

    const result = await sut.execute('user-123', '2024-02')

    expect(result).toEqual({
      year_month: '2024-02',
      amount_cents: 500000,
      is_carried_over: false,
      source_month: null,
    })
    expect(mockRepository.findByMonth).toHaveBeenCalledWith('user-123', '2024-02')
    expect(mockRepository.findMostRecentBefore).not.toHaveBeenCalled()
  })

  it('returns carried-over limit when no explicit limit exists', async () => {
    const previousLimit = {
      id: 'limit-1',
      user_id: 'user-123',
      year_month: '2024-01',
      amount_cents: 450000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    mockRepository.findByMonth.mockResolvedValue(null)
    mockRepository.findMostRecentBefore.mockResolvedValue(previousLimit)

    const result = await sut.execute('user-123', '2024-03')

    expect(result).toEqual({
      year_month: '2024-03',
      amount_cents: 450000,
      is_carried_over: true,
      source_month: '2024-01',
    })
    expect(mockRepository.findMostRecentBefore).toHaveBeenCalledWith('user-123', '2024-03')
  })

  it('returns null when no limits exist', async () => {
    mockRepository.findByMonth.mockResolvedValue(null)
    mockRepository.findMostRecentBefore.mockResolvedValue(null)

    const result = await sut.execute('user-123', '2024-01')

    expect(result).toBeNull()
  })

  it('prefers explicit limit over carried-over limit', async () => {
    const explicitLimit = {
      id: 'limit-2',
      user_id: 'user-123',
      year_month: '2024-02',
      amount_cents: 600000,
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    }
    mockRepository.findByMonth.mockResolvedValue(explicitLimit)

    const result = await sut.execute('user-123', '2024-02')

    expect(result?.is_carried_over).toBe(false)
    expect(result?.amount_cents).toBe(600000)
    expect(mockRepository.findMostRecentBefore).not.toHaveBeenCalled()
  })
})
