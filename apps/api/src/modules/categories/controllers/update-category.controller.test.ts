import type { UpdateCategory } from '@plim/shared'
import { createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpdateCategoryUseCase } from '../update-category.usecase'
import { updateCategoryController } from './update-category.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('updateCategoryController', () => {
  let sut: typeof updateCategoryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'
  const categoryId = 'category-123'

  beforeEach(() => {
    sut = updateCategoryController
    mockUseCase = createMockUseCase()
  })

  it('updates category with valid input', async () => {
    const input: UpdateCategory = {
      name: 'Groceries',
      color: '#0000FF',
    }
    const category = createMockCategory({
      id: categoryId,
      user_id: userId,
      name: 'Groceries',
      color: '#0000FF',
    })
    mockUseCase.execute.mockResolvedValue(category)

    const result = await sut(
      userId,
      categoryId,
      input,
      mockUseCase as unknown as UpdateCategoryUseCase
    )

    expect(result).toEqual(category)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, categoryId, input)
  })

  it('updates only specified fields', async () => {
    const input: UpdateCategory = { name: 'New Name' }
    const category = createMockCategory({
      id: categoryId,
      user_id: userId,
      name: 'New Name',
    })
    mockUseCase.execute.mockResolvedValue(category)

    const result = await sut(
      userId,
      categoryId,
      input,
      mockUseCase as unknown as UpdateCategoryUseCase
    )

    expect(result.name).toBe('New Name')
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, categoryId, input)
  })

  it('passes through use case errors', async () => {
    const input: UpdateCategory = {
      name: 'Groceries',
      color: '#0000FF',
    }
    const error = new Error('Category not found')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, categoryId, input, mockUseCase as unknown as UpdateCategoryUseCase)
    ).rejects.toThrow('Category not found')
  })
})
