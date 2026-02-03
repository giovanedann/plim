import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'

type MockRepository = {
  getSalariesForPeriod: ReturnType<typeof vi.fn>
  formatSalaryTimeline: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getSalariesForPeriod: vi.fn(),
    formatSalaryTimeline: vi.fn(),
  }
}

describe('GetSalaryTimelineUseCase', () => {
  let sut: GetSalaryTimelineUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetSalaryTimelineUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns salary timeline for period', async () => {
    const salaries = [
      createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
      createMockSalaryHistory({ effective_from: '2024-06-01', amount_cents: 550000 }),
    ]
    const timelineData = [
      { date: '2024-01-01', amount: 500000 },
      { date: '2024-06-01', amount: 550000 },
    ]

    mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
    mockRepository.formatSalaryTimeline.mockReturnValue(timelineData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    })

    expect(result.data).toEqual(timelineData)
  })

  it('returns empty timeline when no salary history', async () => {
    mockRepository.getSalariesForPeriod.mockResolvedValue([])
    mockRepository.formatSalaryTimeline.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    })

    expect(result.data).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles single salary entry', async () => {
      const salaries = [createMockSalaryHistory({ amount_cents: 500000 })]
      const timelineData = [{ date: '2026-01-01', amount: 500000 }]

      mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
      mockRepository.formatSalaryTimeline.mockReturnValue(timelineData)

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      })

      expect(result.data).toHaveLength(1)
    })

    it('handles multiple salary changes in same period', async () => {
      const salaries = [
        createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
        createMockSalaryHistory({ effective_from: '2024-03-01', amount_cents: 520000 }),
        createMockSalaryHistory({ effective_from: '2024-06-01', amount_cents: 550000 }),
      ]
      const timelineData = [
        { date: '2024-01-01', amount: 500000 },
        { date: '2024-03-01', amount: 520000 },
        { date: '2024-06-01', amount: 550000 },
      ]

      mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
      mockRepository.formatSalaryTimeline.mockReturnValue(timelineData)

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      })

      expect(result.data).toHaveLength(3)
    })
  })
})
