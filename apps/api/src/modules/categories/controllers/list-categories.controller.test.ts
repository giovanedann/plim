import { createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ListCategoriesUseCase } from '../list-categories.usecase'
import { listCategoriesController } from './list-categories.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('listCategoriesController', () => {
  let sut: typeof listCategoriesController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = listCategoriesController
    mockUseCase = createMockUseCase()
  })

  it('returns list of categories', async () => {
    const categories = [
      createMockCategory({
        user_id: userId,
        name: 'Food',
        icon: 'utensils',
        color: '#FF5733',
      }),
      createMockCategory({
        user_id: userId,
        name: 'Transport',
        icon: 'car',
        color: '#33FF57',
      }),
    ]
    mockUseCase.execute.mockResolvedValue(categories)

    const result = await sut(userId, mockUseCase as unknown as ListCategoriesUseCase)

    expect(result).toEqual(categories)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId)
  })

  it('returns empty array when no categories exist', async () => {
    mockUseCase.execute.mockResolvedValue([])

    const result = await sut(userId, mockUseCase as unknown as ListCategoriesUseCase)

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('passes through use case errors', async () => {
    const error = new Error('Database error')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, mockUseCase as unknown as ListCategoriesUseCase)).rejects.toThrow(
      'Database error'
    )
  })
})
