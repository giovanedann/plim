import { createMockCategory, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  aggregateByCategory: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    aggregateByCategory: vi.fn(),
  }
}

describe('GetCategoryBreakdownUseCase', () => {
  let sut: GetCategoryBreakdownUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetCategoryBreakdownUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns category breakdown with expenses', async () => {
    const category1 = createMockCategory({ id: 'cat-1', name: 'Food' })
    const category2 = createMockCategory({ id: 'cat-2', name: 'Transport' })
    const expenses = [
      createMockExpense({ amount_cents: 10000, category_id: category1.id }),
      createMockExpense({ amount_cents: 20000, category_id: category2.id }),
    ]
    const aggregatedData = [
      { category_id: category1.id, name: category1.name, amount: 10000, percentage: 33.3 },
      { category_id: category2.id, name: category2.name, amount: 20000, percentage: 66.7 },
    ]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateByCategory.mockReturnValue(aggregatedData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.total).toBe(30000)
    expect(result.data).toEqual(aggregatedData)
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

  describe('boundary cases', () => {
    it('handles single category with all expenses', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Food' })
      const expenses = [
        createMockExpense({ amount_cents: 10000, category_id: category.id }),
        createMockExpense({ amount_cents: 20000, category_id: category.id }),
      ]
      const aggregatedData = [
        { category_id: category.id, name: category.name, amount: 30000, percentage: 100 },
      ]
      mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
      mockRepository.aggregateByCategory.mockReturnValue(aggregatedData)

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.percentage).toBe(100)
    })
  })
})
