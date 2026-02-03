import {
  type CreateCategory,
  type UpdateCategory,
  createErrorResponse,
  createMockCategory,
  createSuccessResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { categoryService } from './category.service'

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

type MockApi = {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('categoryService', () => {
  let mockApi: MockApi

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi = api as unknown as MockApi
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listCategories', () => {
    it('fetches all categories', async () => {
      const mockCategories = [createMockCategory(), createMockCategory()]
      mockApi.get.mockResolvedValue(createSuccessResponse(mockCategories))
      const sut = categoryService

      const result = await sut.listCategories()

      expect(result).toEqual({ data: mockCategories })
    })

    it('returns empty array when no categories exist', async () => {
      mockApi.get.mockResolvedValue(createSuccessResponse([]))
      const sut = categoryService

      const result = await sut.listCategories()

      expect(result).toEqual({ data: [] })
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to fetch categories')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.listCategories()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('getCategory', () => {
    it('fetches category by id', async () => {
      const mockCategory = createMockCategory({ id: 'cat-123' })
      mockApi.get.mockResolvedValue(createSuccessResponse(mockCategory))
      const sut = categoryService

      const result = await sut.getCategory('cat-123')

      expect(result).toEqual({ data: mockCategory })
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.getCategory('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createCategory', () => {
    it('creates category with all fields', async () => {
      const input: CreateCategory = {
        name: 'Food & Drinks',
        icon: 'utensils',
        color: '#FF5733',
      }
      const createdCategory = createMockCategory({
        name: 'Food & Drinks',
        icon: 'utensils',
        color: '#FF5733',
      })
      mockApi.post.mockResolvedValue(createSuccessResponse(createdCategory))
      const sut = categoryService

      const result = await sut.createCategory(input)

      expect(result).toEqual({ data: createdCategory })
    })

    it('creates category with only required fields', async () => {
      const input: CreateCategory = {
        name: 'Utilities',
        icon: null,
        color: null,
      }
      mockApi.post.mockResolvedValue(createSuccessResponse(createMockCategory(input)))
      const sut = categoryService

      const result = await sut.createCategory(input)

      expect(result).toHaveProperty('data')
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Name is required')
      mockApi.post.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.createCategory({
        name: '',
        icon: null,
        color: null,
      })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('updateCategory', () => {
    it('updates category with partial data', async () => {
      const input: UpdateCategory = {
        name: 'Updated Name',
      }
      const updatedCategory = createMockCategory({
        id: 'cat-123',
        name: 'Updated Name',
      })
      mockApi.patch.mockResolvedValue(createSuccessResponse(updatedCategory))
      const sut = categoryService

      const result = await sut.updateCategory('cat-123', input)

      expect(result).toEqual({ data: updatedCategory })
    })

    it('updates category with all fields', async () => {
      const input: UpdateCategory = {
        name: 'New Name',
        icon: 'new-icon',
        color: '#00FF00',
        is_active: false,
      }
      mockApi.patch.mockResolvedValue(createSuccessResponse(createMockCategory(input)))
      const sut = categoryService

      const result = await sut.updateCategory('cat-123', input)

      expect(result).toHaveProperty('data')
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      mockApi.patch.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.updateCategory('non-existent', { name: 'Test' })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteCategory', () => {
    it('deletes category by id', async () => {
      mockApi.delete.mockResolvedValue(createSuccessResponse(undefined as unknown as undefined))
      const sut = categoryService

      const result = await sut.deleteCategory('cat-123')

      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      mockApi.delete.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.deleteCategory('non-existent')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when category has associated expenses', async () => {
      const errorResponse = createErrorResponse(
        'CONFLICT',
        'Cannot delete category with associated expenses'
      )
      mockApi.delete.mockResolvedValue(errorResponse)
      const sut = categoryService

      const result = await sut.deleteCategory('cat-with-expenses')

      expect(result).toEqual(errorResponse)
    })
  })
})
