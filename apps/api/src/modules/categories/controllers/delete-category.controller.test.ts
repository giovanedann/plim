import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeleteCategoryUseCase } from '../delete-category.usecase'
import { deleteCategoryController } from './delete-category.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('deleteCategoryController', () => {
  let sut: typeof deleteCategoryController
  let mockUseCase: MockUseCase
  const userId = 'user-123'
  const categoryId = 'category-123'

  beforeEach(() => {
    sut = deleteCategoryController
    mockUseCase = createMockUseCase()
  })

  it('deletes category successfully', async () => {
    mockUseCase.execute.mockResolvedValue(undefined)

    const result = await sut(userId, categoryId, mockUseCase as unknown as DeleteCategoryUseCase)

    expect(result).toBeUndefined()
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, categoryId)
  })

  it('passes through use case errors', async () => {
    const error = new Error('Category not found')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, categoryId, mockUseCase as unknown as DeleteCategoryUseCase)
    ).rejects.toThrow('Category not found')
  })

  it('passes through authorization errors', async () => {
    const error = new Error('Unauthorized')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, categoryId, mockUseCase as unknown as DeleteCategoryUseCase)
    ).rejects.toThrow('Unauthorized')
  })
})
