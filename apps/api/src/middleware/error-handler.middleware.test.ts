import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { Env } from '../types'
import { AppError, errorHandler } from './error-handler.middleware'

type ErrorResponse = { error: { code: string; message: string; details?: unknown } }

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  return app
}

describe('errorHandler', () => {
  let sut: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    sut = createTestApp()
  })

  describe('AppError handling', () => {
    it('returns correct status code from AppError', async () => {
      sut.get('/test', () => {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Resource not found', HTTP_STATUS.NOT_FOUND)
      })

      const res = await sut.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('returns error envelope with code and message', async () => {
      sut.get('/test', () => {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'Access denied', HTTP_STATUS.FORBIDDEN)
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN)
      expect(body.error.message).toBe('Access denied')
    })

    it('includes details when provided', async () => {
      const details = { field: 'email', reason: 'invalid format' }
      sut.get('/test', () => {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid input',
          HTTP_STATUS.BAD_REQUEST,
          details
        )
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.details).toEqual(details)
    })

    it('defaults to 500 status when not specified', async () => {
      sut.get('/test', () => {
        throw new AppError(ERROR_CODES.DATABASE_ERROR, 'Database connection failed')
      })

      const res = await sut.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('ZodError handling', () => {
    it('returns 400 for validation errors', async () => {
      const schema = z.object({ name: z.string().min(1) })
      sut.get('/test', (): never => {
        throw schema.parse({ name: '' })
      })

      const res = await sut.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns VALIDATION_ERROR code', async () => {
      const schema = z.object({ email: z.string().email() })
      sut.get('/test', (): never => {
        throw schema.parse({ email: 'not-an-email' })
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(body.error.message).toBe('Validation failed')
    })

    it('includes flattened error details', async () => {
      const schema = z.object({ age: z.number().positive() })
      sut.get('/test', (): never => {
        throw schema.parse({ age: -5 })
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.details).toBeDefined()
      expect(body.error.details).toHaveProperty('fieldErrors')
    })
  })

  describe('unknown error handling', () => {
    it('returns 500 for unknown errors', async () => {
      sut.get('/test', () => {
        throw new Error('Something went wrong')
      })

      const res = await sut.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })

    it('returns INTERNAL_ERROR code', async () => {
      sut.get('/test', () => {
        throw new Error('Database exploded')
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })

    it('returns generic message without exposing internal details', async () => {
      sut.get('/test', () => {
        throw new Error('SQL injection detected in user_id column')
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.message).toBe('An unexpected error occurred')
      expect(body.error.message).not.toContain('SQL')
      expect(body.error.details).toBeUndefined()
    })

    it('does not expose stack traces', async () => {
      sut.get('/test', () => {
        const err = new Error('Secret error')
        err.stack = 'at /Users/admin/secrets/password.ts:42'
        throw err
      })

      const res = await sut.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      const bodyStr = JSON.stringify(body)
      expect(bodyStr).not.toContain('stack')
      expect(bodyStr).not.toContain('/Users')
      expect(bodyStr).not.toContain('password')
    })

    it('logs unknown errors to console', async () => {
      const error = new Error('Unexpected failure')
      sut.get('/test', () => {
        throw error
      })

      await sut.request('/test', { method: 'GET' })

      expect(console.error).toHaveBeenCalledWith('Unhandled error:', error)
    })
  })
})
