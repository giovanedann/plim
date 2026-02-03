import { createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetExpensesTimelineUseCase } from './get-expenses-timeline.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  aggregateExpensesByTimeline: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    aggregateExpensesByTimeline: vi.fn(),
  }
}

describe('GetExpensesTimelineUseCase', () => {
  let sut: GetExpensesTimelineUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetExpensesTimelineUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns expenses timeline grouped by day', async () => {
    const expenses = [
      createMockExpense({ date: '2024-01-01', amount_cents: 10000 }),
      createMockExpense({ date: '2024-01-02', amount_cents: 15000 }),
    ]
    const timelineData = [
      { date: '2024-01-01', amount: 10000 },
      { date: '2024-01-02', amount: 15000 },
    ]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateExpensesByTimeline.mockReturnValue(timelineData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day',
    })

    expect(result.data).toEqual(timelineData)
    expect(result.group_by).toBe('day')
  })

  it('returns expenses timeline grouped by week', async () => {
    const expenses = [createMockExpense({ date: '2024-01-01', amount_cents: 50000 })]
    const timelineData = [{ date: '2024-W01', amount: 50000 }]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateExpensesByTimeline.mockReturnValue(timelineData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'week',
    })

    expect(result.group_by).toBe('week')
  })

  it('returns expenses timeline grouped by month', async () => {
    const expenses = [createMockExpense({ date: '2024-01-15', amount_cents: 100000 })]
    const timelineData = [{ date: '2024-01', amount: 100000 }]
    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.aggregateExpensesByTimeline.mockReturnValue(timelineData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      group_by: 'month',
    })

    expect(result.group_by).toBe('month')
  })

  it('returns empty timeline when no expenses', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.aggregateExpensesByTimeline.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'day',
    })

    expect(result.data).toEqual([])
  })
})
