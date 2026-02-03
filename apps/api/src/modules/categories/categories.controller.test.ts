import {
  type ApiError,
  type Category,
  ERROR_CODES,
  HTTP_STATUS,
  createMockCategory,
} from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { categoriesController } from './categories.controller'
import { CreateCategoryUseCase } from './create-category.usecase'
import { DeleteCategoryUseCase } from './delete-category.usecase'
import { ListCategoriesUseCase } from './list-categories.usecase'
import { UpdateCategoryUseCase } from './update-category.usecase'

vi.mock('./list-categories.usecase')
vi.mock('./create-category.usecase')
vi.mock('./update-category.usecase')
vi.mock('./delete-category.usecase')

type SuccessResponse<T> = { data: T }
type ErrorResponse = { error: ApiError }

const USER_ID = 'user-123'

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', USER_ID)
    c.set('accessToken', 'test-token')
    await next()
  })
  app.route('/categories', categoriesController)
  return app
}

describe('Categories Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /categories', () => {
    it('returns list of categories', async () => {
      const systemCategory = createMockCategory({ id: 'system-1', user_id: null })
      const userCategory = createMockCategory({ id: 'user-1', user_id: USER_ID })
      const mockExecute = vi.fn().mockResolvedValue([systemCategory, userCategory])
      vi.mocked(ListCategoriesUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListCategoriesUseCase
      )

      const res = await app.request('/categories', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Category[]>
      expect(json.data).toHaveLength(2)
    })

    it('returns empty array when no categories exist', async () => {
      const mockExecute = vi.fn().mockResolvedValue([])
      vi.mocked(ListCategoriesUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListCategoriesUseCase
      )

      const res = await app.request('/categories', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Category[]>
      expect(json.data).toHaveLength(0)
    })
  })

  describe('POST /categories', () => {
    it('creates category with valid data', async () => {
      const category = createMockCategory({ name: 'Custom', icon: '⭐', color: '#00FF00' })
      const mockExecute = vi.fn().mockResolvedValue(category)
      vi.mocked(CreateCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateCategoryUseCase
      )

      const res = await app.request(
        '/categories',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Custom', icon: '⭐', color: '#00FF00' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const json = (await res.json()) as SuccessResponse<Category>
      expect(json.data.name).toBe('Custom')
      expect(json.data.icon).toBe('⭐')
      expect(json.data.color).toBe('#00FF00')
    })

    it('returns 400 for empty name', async () => {
      const res = await app.request(
        '/categories',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for missing required fields', async () => {
      const res = await app.request(
        '/categories',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid color format', async () => {
      const res = await app.request(
        '/categories',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test', icon: '⭐', color: 'not-a-color' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('PATCH /categories/:id', () => {
    it('updates user category', async () => {
      const updatedCategory = createMockCategory({ id: 'user-1', name: 'Updated' })
      const mockExecute = vi.fn().mockResolvedValue(updatedCategory)
      vi.mocked(UpdateCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateCategoryUseCase
      )

      const res = await app.request(
        '/categories/user-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Category>
      expect(json.data.name).toBe('Updated')
    })

    it('returns 403 when modifying system category', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.FORBIDDEN,
            'Cannot modify system category',
            HTTP_STATUS.FORBIDDEN
          )
        )
      vi.mocked(UpdateCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateCategoryUseCase
      )

      const res = await app.request(
        '/categories/system-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Hacked' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      const json = (await res.json()) as ErrorResponse
      expect(json.error.code).toBe(ERROR_CODES.FORBIDDEN)
    })

    it('returns 404 when category not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(UpdateCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateCategoryUseCase
      )

      const res = await app.request(
        '/categories/non-existent',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('returns 400 for invalid update data', async () => {
      const res = await app.request(
        '/categories/user-1',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('DELETE /categories/:id', () => {
    it('soft deletes user category', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCategoryUseCase
      )

      const res = await app.request('/categories/user-1', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('returns 403 when deleting system category', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.FORBIDDEN,
            'Cannot delete system category',
            HTTP_STATUS.FORBIDDEN
          )
        )
      vi.mocked(DeleteCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCategoryUseCase
      )

      const res = await app.request('/categories/system-1', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it('returns 404 when category not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(DeleteCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCategoryUseCase
      )

      const res = await app.request('/categories/non-existent', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
