import { type ApiError, type Category, ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
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

const systemCategory: Category = {
  id: 'system-1',
  user_id: null,
  name: 'Alimentação',
  icon: '🍔',
  color: '#FF5733',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const userCategory: Category = {
  id: 'user-1',
  user_id: 'user-123',
  name: 'Custom',
  icon: '⭐',
  color: '#00FF00',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', 'user-123')
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
      const mockExecute = vi.fn().mockResolvedValue([systemCategory, userCategory])
      vi.mocked(ListCategoriesUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListCategoriesUseCase
      )

      const res = await app.request('/categories', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Category[]>
      expect(json.data).toHaveLength(2)
      expect(mockExecute).toHaveBeenCalledWith('user-123')
    })
  })

  describe('POST /categories', () => {
    it('creates category with valid data', async () => {
      const mockExecute = vi.fn().mockResolvedValue(userCategory)
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
      expect(mockExecute).toHaveBeenCalledWith('user-123', {
        name: 'Custom',
        icon: '⭐',
        color: '#00FF00',
      })
    })

    it('returns 400 for invalid data', async () => {
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
  })

  describe('PATCH /categories/:id', () => {
    it('updates user category', async () => {
      const updatedCategory = { ...userCategory, name: 'Updated' }
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
      expect(mockExecute).toHaveBeenCalledWith('user-123', 'user-1', { name: 'Updated' })
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
  })

  describe('DELETE /categories/:id', () => {
    it('soft deletes user category', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteCategoryUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCategoryUseCase
      )

      const res = await app.request('/categories/user-1', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockExecute).toHaveBeenCalledWith('user-123', 'user-1')
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
  })
})
