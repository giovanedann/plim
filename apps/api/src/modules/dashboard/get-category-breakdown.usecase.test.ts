import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'

describe('GetCategoryBreakdownUseCase', () => {
  let sut: GetCategoryBreakdownUseCase
  let mockRepository: {
    getExpensesForPeriod: ReturnType<typeof vi.fn>
    aggregateByCategory: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      getExpensesForPeriod: vi.fn(),
      aggregateByCategory: vi.fn(),
    }
    sut = new GetCategoryBreakdownUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns category breakdown with expenses', async () => {
    const expenses = [
      { amount_cents: 10000, category_id: 'cat-1' },
      { amount_cents: 20000, category_id: 'cat-2' },
    ]
    const aggregatedData = [
      { category_id: 'cat-1', name: 'Food', amount: 10000, percentage: 33.3 },
      { category_id: 'cat-2', name: 'Transport', amount: 20000, percentage: 66.7 },
    ]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateByCategory.mockReturnValue(aggregatedData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(30000)
    expect(result.data).toEqual(aggregatedData)
    expect(mockRepository.getExpensesForPeriod).toHaveBeenCalledWith('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })
    expect(mockRepository.aggregateByCategory).toHaveBeenCalledWith(expenses, 30000)
  })

  it('returns empty breakdown when no expenses', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateByCategory.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(0)
    expect(result.data).toEqual([])
  })
})
