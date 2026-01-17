import { type ApiError, type Category, ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { categoriesController } from './categories.controller'

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

const mockSupabaseFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockSupabaseFrom }),
}))

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

function mockSelectChain(data: Category[] | Category | null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.or = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue({ data, error })
  chain.single = vi.fn().mockResolvedValue({ data, error })
  return chain
}

function mockInsertChain(data: Category | null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  return chain
}

function mockUpdateChain(data: Category | null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data, error })
  return chain
}

function mockSoftDeleteChain(error: unknown = null, count = 1) {
  const result = Promise.resolve({ error, count })
  const innerChain = { eq: vi.fn().mockReturnValue(result) }
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.update = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(innerChain)
  return chain
}

describe('Categories Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /categories', () => {
    it('returns list of categories', async () => {
      mockSupabaseFrom.mockReturnValue(mockSelectChain([systemCategory, userCategory]))

      const res = await app.request('/categories', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse<Category[]>
      expect(json.data).toHaveLength(2)
    })
  })

  describe('POST /categories', () => {
    it('creates category with valid data', async () => {
      mockSupabaseFrom.mockReturnValue(mockInsertChain(userCategory))

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
      const selectMock = mockSelectChain(userCategory)
      const updateMock = mockUpdateChain({ ...userCategory, name: 'Updated' })
      mockSupabaseFrom.mockReturnValueOnce(selectMock).mockReturnValueOnce(updateMock)

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
      mockSupabaseFrom.mockReturnValue(mockSelectChain(systemCategory))

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
      const selectMock = mockSelectChain(userCategory)
      const deleteMock = mockSoftDeleteChain(null, 1)
      mockSupabaseFrom.mockReturnValueOnce(selectMock).mockReturnValueOnce(deleteMock)

      const res = await app.request('/categories/user-1', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('returns 403 when deleting system category', async () => {
      mockSupabaseFrom.mockReturnValue(mockSelectChain(systemCategory))

      const res = await app.request('/categories/system-1', { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })
})
