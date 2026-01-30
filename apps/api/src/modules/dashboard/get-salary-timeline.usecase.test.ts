import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'

describe('GetSalaryTimelineUseCase', () => {
  let sut: GetSalaryTimelineUseCase
  let mockRepository: {
    getSalariesForPeriod: ReturnType<typeof vi.fn>
    formatSalaryTimeline: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      getSalariesForPeriod: vi.fn(),
      formatSalaryTimeline: vi.fn(),
    }
    sut = new GetSalaryTimelineUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns salary timeline for period', async () => {
    const salaries = [
      { effective_from: '2024-01-01', amount_cents: 500000 },
      { effective_from: '2024-06-01', amount_cents: 550000 },
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
    expect(mockRepository.getSalariesForPeriod).toHaveBeenCalledWith('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    })
    expect(mockRepository.formatSalaryTimeline).toHaveBeenCalledWith(salaries)
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
})
