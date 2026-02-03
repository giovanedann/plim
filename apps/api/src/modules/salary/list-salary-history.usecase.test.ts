import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import type { SalaryRepository } from './salary.repository'

type MockRepository = {
  findAllByUserId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findAllByUserId: vi.fn(),
  }
}

describe('ListSalaryHistoryUseCase', () => {
  let sut: ListSalaryHistoryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ListSalaryHistoryUseCase(mockRepository as unknown as SalaryRepository)
  })

  it('returns salary history sorted by effective_from descending', async () => {
    const salaryHistory = [
      createMockSalaryHistory({ amount_cents: 600000, effective_from: '2024-06-01' }),
      createMockSalaryHistory({ amount_cents: 500000, effective_from: '2024-01-01' }),
    ]
    mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

    const result = await sut.execute('user-123')

    expect(result).toEqual(salaryHistory)
    expect(result).toHaveLength(2)
    expect(result[0]?.effective_from).toBe('2024-06-01')
  })

  it('returns empty array when no salary history exists', async () => {
    mockRepository.findAllByUserId.mockResolvedValue([])

    const result = await sut.execute('user-123')

    expect(result).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles single salary record', async () => {
      const salaryHistory = [createMockSalaryHistory({ amount_cents: 500000 })]
      mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(1)
      expect(result[0]?.amount_cents).toBe(500000)
    })

    it('handles large salary history', async () => {
      const salaryHistory = Array.from({ length: 50 }, (_, i) =>
        createMockSalaryHistory({
          amount_cents: 500000 + i * 10000,
          effective_from: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
        })
      )
      mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(50)
    })

    it('handles salary records with same effective_from date', async () => {
      const salaryHistory = [
        createMockSalaryHistory({ amount_cents: 500000, effective_from: '2024-01-01' }),
        createMockSalaryHistory({ amount_cents: 600000, effective_from: '2024-01-01' }),
      ]
      mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(2)
      expect(result.every((s) => s.effective_from === '2024-01-01')).toBe(true)
    })

    it('handles historical salary spanning multiple years', async () => {
      const salaryHistory = [
        createMockSalaryHistory({ amount_cents: 700000, effective_from: '2024-01-01' }),
        createMockSalaryHistory({ amount_cents: 600000, effective_from: '2023-01-01' }),
        createMockSalaryHistory({ amount_cents: 500000, effective_from: '2022-01-01' }),
      ]
      mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(3)
      expect(result.map((s) => s.effective_from)).toContain('2024-01-01')
      expect(result.map((s) => s.effective_from)).toContain('2023-01-01')
      expect(result.map((s) => s.effective_from)).toContain('2022-01-01')
    })
  })
})
