import { createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetPaymentBreakdownUseCase } from './get-payment-breakdown.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  aggregateByPaymentMethod: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    aggregateByPaymentMethod: vi.fn(),
  }
}

describe('GetPaymentBreakdownUseCase', () => {
  let sut: GetPaymentBreakdownUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetPaymentBreakdownUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns payment breakdown with expenses', async () => {
    const expenses = [
      createMockExpense({ amount_cents: 15000, payment_method: 'credit_card' }),
      createMockExpense({ amount_cents: 10000, payment_method: 'pix' }),
    ]
    const aggregatedData = [
      { method: 'credit_card', amount: 15000, percentage: 60 },
      { method: 'pix', amount: 10000, percentage: 40 },
    ]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateByPaymentMethod.mockReturnValue(aggregatedData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(25000)
    expect(result.data).toEqual(aggregatedData)
  })

  it('returns empty breakdown when no expenses', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByPaymentMethod.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(0)
    expect(result.data).toEqual([])
  })
})
