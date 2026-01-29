import {
  type CreateCategory,
  type UpdateCategory,
  createErrorResponse,
  createMockCategory,
  createSuccessResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { categoryService } from './category.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listCategories', () => {
    it('calls correct endpoint', async () => {
      const mockCategories = [createMockCategory(), createMockCategory()]
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockCategories))

      const result = await categoryService.listCategories()

      expect(api.get).toHaveBeenCalledWith('/categories')
      expect(result).toEqual({ data: mockCategories })
    })

    it('returns empty array when no categories exist', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse([]))

      const result = await categoryService.listCategories()

      expect(result).toEqual({ data: [] })
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to fetch categories')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await categoryService.listCategories()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('getCategory', () => {
    it('calls correct endpoint with category id', async () => {
      const mockCategory = createMockCategory({ id: 'cat-123' })
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockCategory))

      const result = await categoryService.getCategory('cat-123')

      expect(api.get).toHaveBeenCalledWith('/categories/cat-123')
      expect(result).toEqual({ data: mockCategory })
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await categoryService.getCategory('non-existent')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createCategory', () => {
    it('sends correct payload with all fields', async () => {
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
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdCategory))

      const result = await categoryService.createCategory(input)

      expect(api.post).toHaveBeenCalledWith('/categories', input)
      expect(result).toEqual({ data: createdCategory })
    })

    it('sends correct payload with only required fields', async () => {
      const input: CreateCategory = {
        name: 'Utilities',
        icon: null,
        color: null,
      }
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockCategory(input)))

      await categoryService.createCategory(input)

      expect(api.post).toHaveBeenCalledWith('/categories', input)
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Name is required')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await categoryService.createCategory({
        name: '',
        icon: null,
        color: null,
      })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('updateCategory', () => {
    it('sends correct payload with partial update', async () => {
      const input: UpdateCategory = {
        name: 'Updated Name',
      }
      const updatedCategory = createMockCategory({
        id: 'cat-123',
        name: 'Updated Name',
      })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedCategory))

      const result = await categoryService.updateCategory('cat-123', input)

      expect(api.patch).toHaveBeenCalledWith('/categories/cat-123', input)
      expect(result).toEqual({ data: updatedCategory })
    })

    it('sends correct payload with all updateable fields', async () => {
      const input: UpdateCategory = {
        name: 'New Name',
        icon: 'new-icon',
        color: '#00FF00',
        is_active: false,
      }
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(createMockCategory(input)))

      await categoryService.updateCategory('cat-123', input)

      expect(api.patch).toHaveBeenCalledWith('/categories/cat-123', input)
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await categoryService.updateCategory('non-existent', { name: 'Test' })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteCategory', () => {
    it('calls correct endpoint with category id', async () => {
      vi.mocked(api.delete).mockResolvedValue(
        createSuccessResponse(undefined as unknown as undefined)
      )

      const result = await categoryService.deleteCategory('cat-123')

      expect(api.delete).toHaveBeenCalledWith('/categories/cat-123')
      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when category not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Category not found')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await categoryService.deleteCategory('non-existent')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when category has associated expenses', async () => {
      const errorResponse = createErrorResponse(
        'CONFLICT',
        'Cannot delete category with associated expenses'
      )
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await categoryService.deleteCategory('cat-with-expenses')

      expect(result).toEqual(errorResponse)
    })
  })
})
