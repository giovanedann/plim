import { createMockCreditCard, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'

type MockRepository = {
  getExpensesWithCreditCards: ReturnType<typeof vi.fn>
  aggregateByCreditCard: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesWithCreditCards: vi.fn(),
    aggregateByCreditCard: vi.fn(),
  }
}

describe('GetCreditCardBreakdownUseCase', () => {
  let sut: GetCreditCardBreakdownUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetCreditCardBreakdownUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns credit card breakdown with expenses', async () => {
    const card1 = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
    const card2 = createMockCreditCard({ id: 'card-2', name: 'Inter' })
    const expenses = [
      createMockExpense({ amount_cents: 20000, credit_card_id: card1.id }),
      createMockExpense({ amount_cents: 10000, credit_card_id: card2.id }),
    ]
    const aggregatedData = [
      { credit_card_id: card1.id, name: card1.name, amount: 20000, percentage: 66.7 },
      { credit_card_id: card2.id, name: card2.name, amount: 10000, percentage: 33.3 },
    ]
    mockRepository.getExpensesWithCreditCards.mockResolvedValue(expenses)
    mockRepository.aggregateByCreditCard.mockReturnValue(aggregatedData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(30000)
    expect(result.data).toEqual(aggregatedData)
  })

  it('returns empty breakdown when no credit card expenses', async () => {
    mockRepository.getExpensesWithCreditCards.mockResolvedValue([])
    mockRepository.aggregateByCreditCard.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(0)
    expect(result.data).toEqual([])
  })
})
