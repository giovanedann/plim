import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetSalaryUseCase } from './get-salary.usecase'
import type { SalaryRepository } from './salary.repository'

type MockRepository = Pick<SalaryRepository, 'findActiveForMonth'>

function createMockRepository(): MockRepository {
  return {
    findActiveForMonth: vi.fn(),
  }
}

describe('GetSalaryUseCase', () => {
  let sut: GetSalaryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetSalaryUseCase(mockRepository as SalaryRepository)
  })

  it('returns active salary for month', async () => {
    const salary = createMockSalaryHistory({ user_id: 'user-123', effective_from: '2024-03-01' })
    mockRepository.findActiveForMonth = vi.fn().mockResolvedValue(salary)

    const result = await sut.execute('user-123', '2024-03')

    expect(result).toEqual(salary)
  })

  it('returns null when no salary exists', async () => {
    mockRepository.findActiveForMonth = vi.fn().mockResolvedValue(null)

    const result = await sut.execute('user-123', '2024-01')

    expect(result).toBeNull()
  })
})
