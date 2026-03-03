import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetDayOfWeekUseCase } from './get-day-of-week.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  aggregateByDayOfWeek: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    aggregateByDayOfWeek: vi.fn(),
  }
}

const defaultQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }

describe('GetDayOfWeekUseCase', () => {
  let sut: GetDayOfWeekUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetDayOfWeekUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns empty data array when no expenses', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result).toEqual({ data: [] })
  })

  it('maps day_of_week=0 to label "Dom"', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([
      { day_of_week: 0, total: 10000, count: 2 },
    ])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.label).toBe('Dom')
  })

  it('maps day_of_week=1 to label "Seg"', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([{ day_of_week: 1, total: 5000, count: 1 }])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.label).toBe('Seg')
  })

  it('maps day_of_week=6 to label "Sáb"', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([{ day_of_week: 6, total: 8000, count: 2 }])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.label).toBe('Sáb')
  })

  it('calculates average_amount correctly as Math.round(total / count)', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([
      { day_of_week: 3, total: 15000, count: 4 },
    ])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.average_amount).toBe(3750)
  })

  it('returns 0 for average_amount when count is 0', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([{ day_of_week: 2, total: 0, count: 0 }])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.average_amount).toBe(0)
  })

  it('preserves day_of_week value in the returned entry', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByDayOfWeek.mockReturnValue([{ day_of_week: 4, total: 9000, count: 3 }])

    const result = await sut.execute('user-123', defaultQuery)

    expect(result.data[0]!.day_of_week).toBe(4)
    expect(result.data[0]!.label).toBe('Qui')
    expect(result.data[0]!.average_amount).toBe(3000)
  })

  describe('boundary cases', () => {
    it('maps all seven days with correct labels', async () => {
      const aggregated = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day_of_week: day,
        total: 7000,
        count: 1,
      }))
      mockRepository.getExpensesForPeriod.mockResolvedValue([])
      mockRepository.aggregateByDayOfWeek.mockReturnValue(aggregated)

      const result = await sut.execute('user-123', defaultQuery)

      const expectedLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      expect(result.data.map((e) => e.label)).toEqual(expectedLabels)
    })
  })
})
