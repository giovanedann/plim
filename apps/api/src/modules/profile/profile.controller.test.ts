import { type ApiError, ERROR_CODES, HTTP_STATUS, type Profile } from '@myfinances/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { profileController } from './profile.controller'

type SuccessResponse = { data: Profile }
type ErrorResponse = { error: ApiError }

const mockProfile: Profile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: null,
  currency: 'BRL',
  locale: 'pt-BR',
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
  createClient: () => ({
    from: mockSupabaseFrom,
  }),
}))

function createTestApp() {
  const app = new Hono<Env>()

  app.onError(errorHandler)

  app.use('*', async (c, next) => {
    c.set('userId', 'user-123')
    c.set('accessToken', 'test-token')
    await next()
  })

  app.route('/profile', profileController)
  return app
}

function mockSelectChain(data: Profile | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }
}

function mockUpdateChain(data: Profile | null, error: unknown = null) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data, error }),
        }),
      }),
    }),
  }
}

describe('Profile Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /profile', () => {
    it('returns profile when found', async () => {
      mockSupabaseFrom.mockReturnValue(mockSelectChain(mockProfile))

      const res = await app.request('/profile', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data).toEqual(mockProfile)
    })

    it('returns 404 when profile not found', async () => {
      mockSupabaseFrom.mockReturnValue(mockSelectChain(null, { code: 'PGRST116' }))

      const res = await app.request('/profile', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      const json = (await res.json()) as ErrorResponse
      expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })
  })

  describe('PATCH /profile', () => {
    const patchRequest = (body: Record<string, unknown>) => ({
      method: 'PATCH' as const,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    it('updates profile with valid data', async () => {
      const updatedProfile = { ...mockProfile, name: 'Jane Doe' }
      mockSupabaseFrom.mockReturnValue(mockUpdateChain(updatedProfile))

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data.name).toBe('Jane Doe')
    })

    it('returns 400 for invalid update data', async () => {
      const res = await app.request('/profile', patchRequest({ currency: 123 }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 404 when profile not found on update', async () => {
      mockSupabaseFrom.mockReturnValue(mockUpdateChain(null, { code: 'PGRST116' }))

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
