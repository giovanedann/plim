import type { SalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import type { SalaryRepository } from './salary.repository'

const salaryHistory: SalaryHistory[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    user_id: '22222222-2222-4222-8222-222222222222',
    amount_cents: 600000,
    effective_from: '2024-06-01',
    created_at: '2024-06-01T00:00:00Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: '22222222-2222-4222-8222-222222222222',
    amount_cents: 500000,
    effective_from: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('ListSalaryHistoryUseCase', () => {
  let useCase: ListSalaryHistoryUseCase
  let mockRepository: { findAllByUserId: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findAllByUserId: vi.fn() }
    useCase = new ListSalaryHistoryUseCase(mockRepository as unknown as SalaryRepository)
  })

  it('returns salary history sorted by effective_from descending', async () => {
    mockRepository.findAllByUserId.mockResolvedValue(salaryHistory)

    const result = await useCase.execute('user-123')

    expect(result).toEqual(salaryHistory)
    expect(result).toHaveLength(2)
    expect(result[0]?.effective_from).toBe('2024-06-01')
    expect(mockRepository.findAllByUserId).toHaveBeenCalledWith('user-123')
  })

  it('returns empty array when no salary history exists', async () => {
    mockRepository.findAllByUserId.mockResolvedValue([])

    const result = await useCase.execute('user-123')

    expect(result).toEqual([])
  })
})
