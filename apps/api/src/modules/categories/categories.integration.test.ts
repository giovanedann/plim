import {
  type Category,
  ERROR_CODES,
  HTTP_STATUS,
  createMockCategory,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { CategoriesDependencies } from './categories.factory'
import { createCategoriesRouterWithDeps } from './categories.routes'

// Mock use cases
const mockListCategories = { execute: vi.fn() }
const mockCreateCategory = { execute: vi.fn() }
const mockUpdateCategory = { execute: vi.fn() }
const mockDeleteCategory = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  listCategories: mockListCategories,
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
} as unknown as CategoriesDependencies

describe('Categories Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createCategoriesRouterWithDeps(mockDependencies)
    app.route('/categories', router)
  })

  describe('GET /categories', () => {
    it('returns list of categories', async () => {
      const categories = [createMockCategory({ name: 'Food', icon: 'utensils' })]
      mockListCategories.execute.mockResolvedValue(categories)

      const res = await app.request('/categories')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Category[] }
      expect(body.data).toEqual(categories)
      expect(mockListCategories.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns empty array when no categories exist', async () => {
      mockListCategories.execute.mockResolvedValue([])

      const res = await app.request('/categories')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Category[] }
      expect(body.data).toEqual([])
    })

    it('handles database errors', async () => {
      mockListCategories.execute.mockRejectedValue(
        new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Database error',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      )

      const res = await app.request('/categories')

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('POST /categories', () => {
    it('creates category with valid input', async () => {
      const category = createMockCategory({ name: 'Food', icon: 'utensils', color: '#FF5733' })
      mockCreateCategory.execute.mockResolvedValue(category)

      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Food',
          icon: 'utensils',
          color: '#FF5733',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: Category }
      expect(body.data).toEqual(category)
      expect(mockCreateCategory.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          name: 'Food',
          icon: 'utensils',
          color: '#FF5733',
        })
      )
    })

    it('validates required fields', async () => {
      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Food',
          // Missing icon and color
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates color format', async () => {
      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Food',
          icon: 'utensils',
          color: 'invalid-color',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles duplicate category errors', async () => {
      mockCreateCategory.execute.mockRejectedValue(
        new AppError(ERROR_CODES.ALREADY_EXISTS, 'Category already exists', HTTP_STATUS.CONFLICT)
      )

      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Food',
          icon: 'utensils',
          color: '#FF5733',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    })
  })

  describe('PATCH /categories/:id', () => {
    it('updates category with valid input', async () => {
      const updatedCategory = createMockCategory({ id: 'category-123', name: 'Groceries' })
      mockUpdateCategory.execute.mockResolvedValue(updatedCategory)

      const res = await app.request('/categories/category-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Groceries',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Category }
      expect(body.data.name).toBe('Groceries')
      expect(mockUpdateCategory.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'category-123',
        expect.objectContaining({ name: 'Groceries' })
      )
    })

    it('updates only specified fields', async () => {
      const updatedCategory = createMockCategory({ id: 'category-123', color: '#0000FF' })
      mockUpdateCategory.execute.mockResolvedValue(updatedCategory)

      const res = await app.request('/categories/category-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: '#0000FF',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockUpdateCategory.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'category-123',
        expect.objectContaining({ color: '#0000FF' })
      )
    })

    it('returns 404 when category not found', async () => {
      mockUpdateCategory.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/categories/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('validates color format on update', async () => {
      const res = await app.request('/categories/category-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: 'not-a-hex-color',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('DELETE /categories/:id', () => {
    it('deletes category successfully', async () => {
      mockDeleteCategory.execute.mockResolvedValue(undefined)

      const res = await app.request('/categories/category-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteCategory.execute).toHaveBeenCalledWith(TEST_USER_ID, 'category-123')
    })

    it('returns 404 when category not found', async () => {
      mockDeleteCategory.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/categories/nonexistent', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('returns 403 when unauthorized', async () => {
      mockDeleteCategory.execute.mockRejectedValue(
        new AppError(ERROR_CODES.FORBIDDEN, 'Unauthorized', HTTP_STATUS.FORBIDDEN)
      )

      const res = await app.request('/categories/category-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })
})
