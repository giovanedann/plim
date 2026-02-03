import { type ApiError, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { accountController } from './account.controller'
import { AccountRepository } from './account.repository'
import { DeleteAccountUseCase } from './delete-account.usecase'
import { ExportDataUseCase } from './export-data.usecase'

vi.mock('./delete-account.usecase')
vi.mock('./export-data.usecase')
vi.mock('./account.repository')
vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn().mockReturnValue({}),
  createSupabaseAdminClient: vi.fn().mockReturnValue({}),
}))

type ErrorResponse = { error: ApiError }

const USER_ID = '33333333-3333-4333-8333-333333333333'

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', USER_ID)
    c.set('accessToken', 'test-token')
    await next()
  })
  app.route('/account', accountController)
  return app
}

describe('Account Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /account/export/:table', () => {
    it('exports profile data as CSV', async () => {
      const csvData = 'user_id,name,email\nuser-123,John,john@test.com'
      const mockExecute = vi.fn().mockResolvedValue(csvData)
      vi.mocked(ExportDataUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ExportDataUseCase
      )

      const res = await app.request('/account/export/profile', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
      expect(res.headers.get('Content-Disposition')).toContain('attachment')
      expect(await res.text()).toBe(csvData)
    })

    it('exports expenses data as CSV', async () => {
      const csvData = 'id,amount,description\n1,1000,Test'
      const mockExecute = vi.fn().mockResolvedValue(csvData)
      vi.mocked(ExportDataUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ExportDataUseCase
      )

      const res = await app.request('/account/export/expenses', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('exports categories data as CSV', async () => {
      const csvData = 'id,name,icon\n1,Food,burger'
      const mockExecute = vi.fn().mockResolvedValue(csvData)
      vi.mocked(ExportDataUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ExportDataUseCase
      )

      const res = await app.request('/account/export/categories', { method: 'GET' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it('returns 400 for invalid table', async () => {
      const res = await app.request('/account/export/invalid-table', { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(body.error.code).toBe(ERROR_CODES.INVALID_INPUT)
    })

    it('returns 429 when exported recently', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.RATE_LIMITED, 'Rate limited', HTTP_STATUS.TOO_MANY_REQUESTS)
        )
      vi.mocked(ExportDataUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ExportDataUseCase
      )

      const res = await app.request('/account/export/profile', { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS)
      expect(body.error.code).toBe(ERROR_CODES.RATE_LIMITED)
    })
  })

  describe('DELETE /account', () => {
    it('deletes account with password', async () => {
      const mockGetUserEmail = vi.fn().mockResolvedValue('test@example.com')
      vi.mocked(AccountRepository).mockImplementation(
        () => ({ getUserEmail: mockGetUserEmail }) as unknown as AccountRepository
      )
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteAccountUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteAccountUseCase
      )

      const res = await app.request(
        '/account',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'password123' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('deletes account without password (social login)', async () => {
      const mockGetUserEmail = vi.fn().mockResolvedValue('test@example.com')
      vi.mocked(AccountRepository).mockImplementation(
        () => ({ getUserEmail: mockGetUserEmail }) as unknown as AccountRepository
      )
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteAccountUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteAccountUseCase
      )

      const res = await app.request(
        '/account',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('returns 404 when profile not found', async () => {
      const mockGetUserEmail = vi.fn().mockResolvedValue(null)
      vi.mocked(AccountRepository).mockImplementation(
        () => ({ getUserEmail: mockGetUserEmail }) as unknown as AccountRepository
      )

      const res = await app.request(
        '/account',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        testEnv
      )
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })

    it('returns 401 when password is incorrect', async () => {
      const mockGetUserEmail = vi.fn().mockResolvedValue('test@example.com')
      vi.mocked(AccountRepository).mockImplementation(
        () => ({ getUserEmail: mockGetUserEmail }) as unknown as AccountRepository
      )
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.UNAUTHORIZED, 'Senha incorreta', HTTP_STATUS.UNAUTHORIZED)
        )
      vi.mocked(DeleteAccountUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteAccountUseCase
      )

      const res = await app.request(
        '/account',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'wrongpassword' }),
        },
        testEnv
      )
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
    })
  })
})
