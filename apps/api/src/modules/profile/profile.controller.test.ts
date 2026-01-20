import { type ApiError, ERROR_CODES, HTTP_STATUS, type Profile } from '@plim/shared'
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

const mockProfile: Profile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: null,
  currency: 'BRL',
  locale: 'pt-BR',
  is_onboarded: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

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

describe('Profile Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /profile', () => {
    it('returns profile when found', async () => {
      const mockExecute = vi.fn().mockResolvedValue(mockProfile)
      vi.mocked(GetProfileUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetProfileUseCase
      )

      const res = await app.request('/profile', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data).toEqual(mockProfile)
      expect(mockExecute).toHaveBeenCalledWith('user-123')
    })

    it('returns 404 when profile not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(GetProfileUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetProfileUseCase
      )

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
      const mockExecute = vi.fn().mockResolvedValue(updatedProfile)
      vi.mocked(UpdateProfileUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateProfileUseCase
      )

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      const json = (await res.json()) as SuccessResponse
      expect(json.data.name).toBe('Jane Doe')
      expect(mockExecute).toHaveBeenCalledWith('user-123', { name: 'Jane Doe' })
    })

    it('returns 400 for invalid update data', async () => {
      const res = await app.request('/profile', patchRequest({ currency: 123 }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 404 when profile not found on update', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(UpdateProfileUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateProfileUseCase
      )

      const res = await app.request('/profile', patchRequest({ name: 'Jane Doe' }), testEnv)

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })
})
