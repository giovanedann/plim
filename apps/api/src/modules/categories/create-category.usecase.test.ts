import { type CreateCategory, ERROR_CODES, HTTP_STATUS, createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'

type MockRepository = {
  create: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    create: vi.fn(),
  }
}

describe('CreateCategoryUseCase', () => {
  let sut: CreateCategoryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new CreateCategoryUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('creates and returns new category', async () => {
    const input: CreateCategory = { name: 'New Category', icon: '🎯', color: '#0000FF' }
    const createdCategory = createMockCategory({
      name: 'New Category',
      icon: '🎯',
      color: '#0000FF',
    })
    mockRepository.create.mockResolvedValue(createdCategory)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdCategory)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    const input: CreateCategory = { name: 'Test', icon: null, color: null }
    mockRepository.create.mockResolvedValue(null)

    await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', input)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary cases', () => {
    it('handles long category name', async () => {
      const longName = 'A'.repeat(100)
      const input: CreateCategory = { name: longName, icon: '📌', color: '#FF0000' }
      const category = createMockCategory({ name: longName })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result.name).toBe(longName)
    })

    it('handles category with null icon and color', async () => {
      const input: CreateCategory = { name: 'Plain Category', icon: null, color: null }
      const category = createMockCategory({ name: 'Plain Category', icon: null, color: null })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result.icon).toBeNull()
      expect(result.color).toBeNull()
    })
  })
})
