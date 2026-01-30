import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'

describe('GetCreditCardBreakdownUseCase', () => {
  let sut: GetCreditCardBreakdownUseCase
  let mockRepository: {
    getExpensesWithCreditCards: ReturnType<typeof vi.fn>
    aggregateByCreditCard: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      getExpensesWithCreditCards: vi.fn(),
      aggregateByCreditCard: vi.fn(),
    }
    sut = new GetCreditCardBreakdownUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns credit card breakdown with expenses', async () => {
    const expenses = [
      { amount_cents: 20000, credit_card_id: 'card-1' },
      { amount_cents: 10000, credit_card_id: 'card-2' },
    ]
    const aggregatedData = [
      { credit_card_id: 'card-1', name: 'Nubank', amount: 20000, percentage: 66.7 },
      { credit_card_id: 'card-2', name: 'Inter', amount: 10000, percentage: 33.3 },
    ]
    mockRepository.getExpensesWithCreditCards.mockResolvedValue(expenses)
    mockRepository.aggregateByCreditCard.mockReturnValue(aggregatedData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(30000)
    expect(result.data).toEqual(aggregatedData)
    expect(mockRepository.getExpensesWithCreditCards).toHaveBeenCalledWith('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })
    expect(mockRepository.aggregateByCreditCard).toHaveBeenCalledWith(expenses, 30000)
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
