import {
  type ApiError,
  ERROR_CODES,
  HTTP_STATUS,
  type Profile,
  createMockProfile,
} from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { GetProfileUseCase } from './get-profile.usecase'
import { profileController } from './profile.controller'
import { UpdateProfileUseCase } from './update-profile.usecase'

vi.mock('./get-profile.usecase')
vi.mock('./update-profile.usecase')

type SuccessResponse = { data: Profile }
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

  app.route('/profile', profileController)
  return app
}

describe('Profile Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /profile', () => {
    it('returns profile when found', async () => {
      const profile = createMockProfile({ user_id: USER_ID })
      const mockExecute = vi.fn().mockResolvedValue(profile)
      vi.mocked(GetProfileUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as GetProfileUseCase
      })

      const res = await app.request('/profile', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data.user_id).toBe(USER_ID)
      expect(json.data.email).toBeDefined()
    })

    it('returns 404 when profile not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(GetProfileUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as GetProfileUseCase
      })

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
      const updatedProfile = createMockProfile({ user_id: USER_ID, name: 'Jane Doe' })
      const mockExecute = vi.fn().mockResolvedValue(updatedProfile)
      vi.mocked(UpdateProfileUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as UpdateProfileUseCase
      })

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data.name).toBe('Jane Doe')
    })

    it('returns 400 for invalid currency type', async () => {
      const res = await app.request('/profile', patchRequest({ currency: 123 }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid avatar_url type', async () => {
      const res = await app.request('/profile', patchRequest({ avatar_url: 123 }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 404 when profile not found on update', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(UpdateProfileUseCase).mockImplementation(function () {
        return { execute: mockExecute } as unknown as UpdateProfileUseCase
      })

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
