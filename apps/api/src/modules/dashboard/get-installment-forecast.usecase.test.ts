import { createMockExpense } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'

type MockRepository = {
  getFutureExpenses: ReturnType<typeof vi.fn>
  calculateInstallmentForecast: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getFutureExpenses: vi.fn(),
    calculateInstallmentForecast: vi.fn(),
  }
}

describe('GetInstallmentForecastUseCase', () => {
  let sut: GetInstallmentForecastUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))

    mockRepository = createMockDashboardRepository()
    sut = new GetInstallmentForecastUseCase(mockRepository as unknown as DashboardRepository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns installment forecast for next 6 months', async () => {
    const expenses = [
      createMockExpense({
        date: '2024-02-15',
        amount_cents: 10000,
        installment_group_id: 'group-1',
        installment_current: 1,
        installment_total: 2,
      }),
      createMockExpense({
        date: '2024-03-15',
        amount_cents: 10000,
        installment_group_id: 'group-1',
        installment_current: 2,
        installment_total: 2,
      }),
    ]
    const forecastData = [
      { month: '2024-02', total: 10000 },
      { month: '2024-03', total: 10000 },
    ]

    mockRepository.getFutureExpenses.mockResolvedValue(expenses)
    mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

    const result = await sut.execute('user-123')

    expect(result.data).toEqual(forecastData)
  })

  it('returns installment forecast for custom months', async () => {
    const expenses = [createMockExpense({ date: '2024-02-15', amount_cents: 5000 })]
    const forecastData = [{ month: '2024-02', total: 5000 }]

    mockRepository.getFutureExpenses.mockResolvedValue(expenses)
    mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

    const result = await sut.execute('user-123', 3)

    expect(result.data).toEqual(forecastData)
  })

  it('returns empty forecast when no future installments', async () => {
    mockRepository.getFutureExpenses.mockResolvedValue([])
    mockRepository.calculateInstallmentForecast.mockReturnValue([])

    const result = await sut.execute('user-123')

    expect(result.data).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles forecast for 1 month', async () => {
      const expenses = [createMockExpense({ date: '2024-02-15', amount_cents: 10000 })]
      const forecastData = [{ month: '2024-02', total: 10000 }]

      mockRepository.getFutureExpenses.mockResolvedValue(expenses)
      mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

      const result = await sut.execute('user-123', 1)

      expect(result.data).toHaveLength(1)
    })

    it('handles forecast for 12 months', async () => {
      const expenses = Array.from({ length: 12 }, (_, i) =>
        createMockExpense({
          date: `2024-${String(i + 2).padStart(2, '0')}-15`,
          amount_cents: 5000,
          installment_current: i + 1,
          installment_total: 12,
        })
      )
      const forecastData = Array.from({ length: 12 }, (_, i) => ({
        month: `2024-${String(i + 2).padStart(2, '0')}`,
        total: 5000,
      }))

      mockRepository.getFutureExpenses.mockResolvedValue(expenses)
      mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

      const result = await sut.execute('user-123', 12)

      expect(result.data).toHaveLength(12)
    })
  })
})
