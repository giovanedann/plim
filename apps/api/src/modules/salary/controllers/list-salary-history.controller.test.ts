import { createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ListSalaryHistoryUseCase } from '../list-salary-history.usecase'
import { listSalaryHistoryController } from './list-salary-history.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('listSalaryHistoryController', () => {
  let sut: typeof listSalaryHistoryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = listSalaryHistoryController
    mockUseCase = createMockUseCase()
  })

  it('returns salary history list', async () => {
    const history = [
      createMockSalaryHistory({
        user_id: userId,
        amount_cents: 500000,
        effective_from: '2024-01-01',
      }),
      createMockSalaryHistory({
        user_id: userId,
        amount_cents: 520000,
        effective_from: '2024-02-01',
      }),
    ]
    mockUseCase.execute.mockResolvedValue(history)

    const result = await sut(userId, mockUseCase as unknown as ListSalaryHistoryUseCase)

    expect(result).toEqual(history)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId)
  })

  it('returns empty array when no history exists', async () => {
    mockUseCase.execute.mockResolvedValue([])

    const result = await sut(userId, mockUseCase as unknown as ListSalaryHistoryUseCase)

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('passes through use case errors', async () => {
    const error = new Error('Database error')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, mockUseCase as unknown as ListSalaryHistoryUseCase)).rejects.toThrow(
      'Database error'
    )
  })
})
