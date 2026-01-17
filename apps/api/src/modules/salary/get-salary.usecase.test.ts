import type { SalaryHistory } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetSalaryUseCase } from './get-salary.usecase'
import type { SalaryRepository } from './salary.repository'

const baseSalary: SalaryHistory = {
  id: '11111111-1111-1111-1111-111111111111',
  user_id: '22222222-2222-2222-2222-222222222222',
  amount_cents: 500000,
  effective_from: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
}

describe('GetSalaryUseCase', () => {
  let useCase: GetSalaryUseCase
  let mockRepository: { findActiveForMonth: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findActiveForMonth: vi.fn() }
    useCase = new GetSalaryUseCase(mockRepository as unknown as SalaryRepository)
  })

  it('returns active salary for month', async () => {
    mockRepository.findActiveForMonth.mockResolvedValue(baseSalary)

    const result = await useCase.execute('user-123', '2024-03')

    expect(result).toEqual(baseSalary)
    expect(mockRepository.findActiveForMonth).toHaveBeenCalledWith('user-123', '2024-03')
  })

  it('returns null when no salary exists', async () => {
    mockRepository.findActiveForMonth.mockResolvedValue(null)

    const result = await useCase.execute('user-123', '2024-01')

    expect(result).toBeNull()
  })
})
