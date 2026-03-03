import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetSpendingLimitProgressUseCase } from './get-spending-limit-progress.usecase'

type MockRepository = {
  getSpendingLimitProgress: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getSpendingLimitProgress: vi.fn(),
  }
}

describe('GetSpendingLimitProgressUseCase', () => {
  let sut: GetSpendingLimitProgressUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetSpendingLimitProgressUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns null when repository returns null (no limit configured)', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue(null)

    const result = await sut.execute('user-123')

    expect(result).toBeNull()
  })

  it('calculates percentage correctly', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue({
      spent_cents: 5000,
      limit_cents: 10000,
      days_remaining: 15,
    })

    const result = await sut.execute('user-123')

    expect(result).not.toBeNull()
    expect(result!.percentage).toBe(50)
  })

  it('returns 0 percentage when limit_cents is 0', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue({
      spent_cents: 0,
      limit_cents: 0,
      days_remaining: 10,
    })

    const result = await sut.execute('user-123')

    expect(result).not.toBeNull()
    expect(result!.percentage).toBe(0)
  })

  it('returns correct days_remaining from repository result', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue({
      spent_cents: 2000,
      limit_cents: 8000,
      days_remaining: 7,
    })

    const result = await sut.execute('user-123')

    expect(result).not.toBeNull()
    expect(result!.days_remaining).toBe(7)
  })

  it('handles exact 100% utilization', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue({
      spent_cents: 10000,
      limit_cents: 10000,
      days_remaining: 0,
    })

    const result = await sut.execute('user-123')

    expect(result).not.toBeNull()
    expect(result!.percentage).toBe(100)
    expect(result!.spent_cents).toBe(10000)
    expect(result!.limit_cents).toBe(10000)
  })

  it('returns spent_cents and limit_cents from repository result', async () => {
    mockRepository.getSpendingLimitProgress.mockResolvedValue({
      spent_cents: 3000,
      limit_cents: 12000,
      days_remaining: 20,
    })

    const result = await sut.execute('user-123')

    expect(result).not.toBeNull()
    expect(result!.spent_cents).toBe(3000)
    expect(result!.limit_cents).toBe(12000)
  })

  describe('boundary cases', () => {
    it('rounds percentage to one decimal place', async () => {
      mockRepository.getSpendingLimitProgress.mockResolvedValue({
        spent_cents: 1000,
        limit_cents: 3000,
        days_remaining: 5,
      })

      const result = await sut.execute('user-123')

      expect(result).not.toBeNull()
      expect(result!.percentage).toBe(33.3)
    })

    it('handles over-limit spending (percentage > 100)', async () => {
      mockRepository.getSpendingLimitProgress.mockResolvedValue({
        spent_cents: 15000,
        limit_cents: 10000,
        days_remaining: 0,
      })

      const result = await sut.execute('user-123')

      expect(result).not.toBeNull()
      expect(result!.percentage).toBe(150)
    })
  })
})
