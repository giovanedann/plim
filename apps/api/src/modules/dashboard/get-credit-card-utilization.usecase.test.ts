import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetCreditCardUtilizationUseCase } from './get-credit-card-utilization.usecase'

type MockRepository = {
  getCreditCardUtilization: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getCreditCardUtilization: vi.fn(),
  }
}

describe('GetCreditCardUtilizationUseCase', () => {
  let sut: GetCreditCardUtilizationUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetCreditCardUtilizationUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns { data: [] } when repository returns empty array', async () => {
    mockRepository.getCreditCardUtilization.mockResolvedValue([])

    const result = await sut.execute('user-123')

    expect(result).toEqual({ data: [] })
  })

  it('returns cards wrapped in { data } when repository returns cards', async () => {
    const cards = [
      {
        credit_card_id: 'cc-1',
        name: 'Nubank',
        used_cents: 5000,
        limit_cents: 20000,
        utilization_percentage: 25,
      },
      {
        credit_card_id: 'cc-2',
        name: 'Itaú',
        used_cents: 10000,
        limit_cents: 10000,
        utilization_percentage: 100,
      },
    ]
    mockRepository.getCreditCardUtilization.mockResolvedValue(cards)

    const result = await sut.execute('user-123')

    expect(result).toEqual({ data: cards })
  })

  it('passes userId to the repository', async () => {
    mockRepository.getCreditCardUtilization.mockResolvedValue([])

    await sut.execute('user-456')

    expect(mockRepository.getCreditCardUtilization).toHaveBeenCalledWith('user-456')
    expect(mockRepository.getCreditCardUtilization).toHaveBeenCalledTimes(1)
  })
})
