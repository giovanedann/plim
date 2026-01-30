import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'

describe('GetInstallmentForecastUseCase', () => {
  let sut: GetInstallmentForecastUseCase
  let mockRepository: {
    getFutureExpenses: ReturnType<typeof vi.fn>
    calculateInstallmentForecast: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))

    mockRepository = {
      getFutureExpenses: vi.fn(),
      calculateInstallmentForecast: vi.fn(),
    }
    sut = new GetInstallmentForecastUseCase(mockRepository as unknown as DashboardRepository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns installment forecast for next 6 months', async () => {
    const expenses = [
      { date: '2024-02-15', amount_cents: 10000, installment_group_id: 'group-1' },
      { date: '2024-03-15', amount_cents: 10000, installment_group_id: 'group-1' },
    ]
    const forecastData = [
      { month: '2024-02', total: 10000 },
      { month: '2024-03', total: 10000 },
    ]

    mockRepository.getFutureExpenses.mockResolvedValue(expenses)
    mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

    const result = await sut.execute('user-123')

    expect(result.data).toEqual(forecastData)
    expect(mockRepository.getFutureExpenses).toHaveBeenCalledWith('user-123', '2024-02-01', 6)
    expect(mockRepository.calculateInstallmentForecast).toHaveBeenCalledWith(expenses, 6)
  })

  it('returns installment forecast for custom months', async () => {
    const expenses = [{ date: '2024-02-15', amount_cents: 5000 }]
    const forecastData = [{ month: '2024-02', total: 5000 }]

    mockRepository.getFutureExpenses.mockResolvedValue(expenses)
    mockRepository.calculateInstallmentForecast.mockReturnValue(forecastData)

    await sut.execute('user-123', 3)

    expect(mockRepository.getFutureExpenses).toHaveBeenCalledWith('user-123', '2024-02-01', 3)
    expect(mockRepository.calculateInstallmentForecast).toHaveBeenCalledWith(expenses, 3)
  })

  it('returns empty forecast when no future installments', async () => {
    mockRepository.getFutureExpenses.mockResolvedValue([])
    mockRepository.calculateInstallmentForecast.mockReturnValue([])

    const result = await sut.execute('user-123')

    expect(result.data).toEqual([])
  })
})
