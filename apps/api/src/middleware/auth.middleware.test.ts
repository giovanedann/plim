import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { authMiddleware } from './auth.middleware'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@supabase/supabase-js'

type ErrorResponse = { error: { code: string; message: string } }

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

function mockSupabaseAuth(user: { id: string; email?: string } | null, error: unknown = null) {
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user }, error })
  const mockClient = { auth: { getUser: mockGetUser } }

  vi.mocked(createClient).mockReturnValue(mockClient as unknown as ReturnType<typeof createClient>)

  return mockGetUser
}

function createTestApp() {
  const app = new Hono<Env>()
  app.use('*', authMiddleware)
  app.get('/protected', (c) => {
    return c.json({
      userId: c.get('userId'),
      accessToken: c.get('accessToken'),
    })
  })
  return app
}

describe('authMiddleware', () => {
  let sut: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    sut = createTestApp()
  })

  describe('missing or invalid Authorization header', () => {
    it('returns 401 when no Authorization header', async () => {
      const res = await sut.request('/protected', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as ErrorResponse
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(body.error.message).toBe('Missing or invalid authorization header')
    })

    it('returns 401 when Authorization header is empty', async () => {
      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: '' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as ErrorResponse
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
    })

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Basic abc123' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as ErrorResponse
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(body.error.message).toBe('Missing or invalid authorization header')
    })
  })

  describe('invalid or expired token', () => {
    it('returns 401 when Supabase returns an error', async () => {
      mockSupabaseAuth(null, { message: 'Token expired' })

      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer invalid-token' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as ErrorResponse
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(body.error.message).toBe('Invalid or expired token')
    })

    it('returns 401 when Supabase returns no user', async () => {
      mockSupabaseAuth(null)

      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer token-with-no-user' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as ErrorResponse
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(body.error.message).toBe('Invalid or expired token')
    })
  })

  describe('valid token', () => {
    it('sets userId and accessToken on context when valid', async () => {
      mockSupabaseAuth({ id: 'user-123', email: 'test@example.com' })

      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer valid-token' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { userId: string; accessToken: string }
      expect(body.userId).toBe('user-123')
      expect(body.accessToken).toBe('valid-token')
    })

    it('calls next() on successful auth', async () => {
      const mockGetUser = mockSupabaseAuth({ id: 'user-456' })

      const res = await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer another-valid-token' },
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockGetUser).toHaveBeenCalledWith('another-valid-token')
    })

    it('creates Supabase client with correct configuration', async () => {
      mockSupabaseAuth({ id: 'user-789' })

      await sut.request(
        '/protected',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-token' },
        },
        testEnv
      )

      expect(createClient).toHaveBeenCalledWith(
        testEnv.SUPABASE_URL,
        testEnv.SUPABASE_PUBLISHABLE_KEY,
        expect.objectContaining({
          global: {
            headers: {
              Authorization: 'Bearer test-token',
            },
          },
        })
      )
    })
  })
})
