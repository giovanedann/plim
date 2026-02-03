import type { CreateCategory } from '@plim/shared'
import { createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateCategoryUseCase } from '../create-category.usecase'
import { createCategoryController } from './create-category.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('createCategoryController', () => {
  let sut: typeof createCategoryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = createCategoryController
    mockUseCase = createMockUseCase()
  })

  it('creates category with valid input', async () => {
    const input: CreateCategory = {
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
    }
    const category = createMockCategory({
      user_id: userId,
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
    })
    mockUseCase.execute.mockResolvedValue(category)

    const result = await sut(userId, input, mockUseCase as unknown as CreateCategoryUseCase)

    expect(result).toEqual(category)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, input)
  })

  it('passes through use case errors', async () => {
    const input: CreateCategory = {
      name: 'Food',
      icon: 'utensils',
      color: '#FF5733',
    }
    const error = new Error('Duplicate category')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, input, mockUseCase as unknown as CreateCategoryUseCase)
    ).rejects.toThrow('Duplicate category')
  })
})
