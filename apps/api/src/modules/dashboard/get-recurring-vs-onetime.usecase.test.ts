import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetRecurringVsOnetimeUseCase } from './get-recurring-vs-onetime.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  aggregateRecurringVsOnetime: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    aggregateRecurringVsOnetime: vi.fn(),
  }
}

const defaultQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }

describe('GetRecurringVsOnetimeUseCase', () => {
  let sut: GetRecurringVsOnetimeUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetRecurringVsOnetimeUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns zero percentages when total is 0', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
      recurring_amount: 0,
      onetime_amount: 0,
    })

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.recurring_amount).toBe(0)
    expect(result.onetime_amount).toBe(0)
    expect(result.recurring_percentage).toBe(0)
    expect(result.onetime_percentage).toBe(0)
  })

  it('returns zero percentages when no expenses exist', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
      recurring_amount: 0,
      onetime_amount: 0,
    })

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.recurring_percentage).toBe(0)
    expect(result.onetime_percentage).toBe(0)
  })

  it('calculates recurring_percentage correctly', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
      recurring_amount: 30000,
      onetime_amount: 70000,
    })

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.recurring_amount).toBe(30000)
    expect(result.recurring_percentage).toBe(30)
  })

  it('calculates onetime_percentage correctly', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
      recurring_amount: 30000,
      onetime_amount: 70000,
    })

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.onetime_amount).toBe(70000)
    expect(result.onetime_percentage).toBe(70)
  })

  describe('boundary cases', () => {
    it('handles all expenses as recurring (100% recurring)', async () => {
      mockRepository.getExpensesForPeriod.mockResolvedValue([])
      mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
        recurring_amount: 50000,
        onetime_amount: 0,
      })

      const result = await sut.execute('user-123', defaultQuery)

      expect(result.recurring_percentage).toBe(100)
      expect(result.onetime_percentage).toBe(0)
    })

    it('rounds percentages to one decimal place', async () => {
      mockRepository.getExpensesForPeriod.mockResolvedValue([])
      mockRepository.aggregateRecurringVsOnetime.mockReturnValue({
        recurring_amount: 10000,
        onetime_amount: 20000,
      })

      const result = await sut.execute('user-123', defaultQuery)

      expect(result.recurring_percentage).toBe(33.3)
      expect(result.onetime_percentage).toBe(66.7)
    })
  })
})
