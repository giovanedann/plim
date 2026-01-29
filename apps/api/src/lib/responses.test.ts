import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { error, paginated, success } from './responses'

type SuccessResponse<T> = { data: T }
type PaginatedResponse<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
type ErrorResponse = { error: { code: string; message: string; details?: unknown } }

function createTestApp() {
  return new Hono()
}

describe('Response Helpers', () => {
  describe('success()', () => {
    it('returns { data: T } format for single object', async () => {
      const app = createTestApp()
      const expense = { id: '123', amount: 5000 }

      app.get('/test', (c) => success(c, expense))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as SuccessResponse<typeof expense>

      expect(body).toEqual({ data: expense })
      expect(body.data).toEqual(expense)
    })

    it('returns { data: T[] } format for arrays', async () => {
      const app = createTestApp()
      const expenses = [{ id: '1' }, { id: '2' }]

      app.get('/test', (c) => success(c, expenses))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as SuccessResponse<typeof expenses>

      expect(body).toEqual({ data: expenses })
      expect(body.data).toHaveLength(2)
    })

    it('defaults to 200 status', async () => {
      const app = createTestApp()

      app.get('/test', (c) => success(c, { ok: true }))

      const res = await app.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it('allows custom status code', async () => {
      const app = createTestApp()

      app.post('/test', (c) => success(c, { id: '123' }, HTTP_STATUS.CREATED))

      const res = await app.request('/test', { method: 'POST' })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })

    it('handles null data', async () => {
      const app = createTestApp()

      app.get('/test', (c) => success(c, null))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as SuccessResponse<null>

      expect(body).toEqual({ data: null })
    })

    it('handles empty array', async () => {
      const app = createTestApp()

      app.get('/test', (c) => success(c, []))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as SuccessResponse<unknown[]>

      expect(body).toEqual({ data: [] })
      expect(body.data).toHaveLength(0)
    })
  })

  describe('paginated()', () => {
    it('returns { data: T[], meta: {...} } format', async () => {
      const app = createTestApp()
      const expenses = [{ id: '1' }, { id: '2' }]
      const meta = { page: 1, limit: 20, total: 100, totalPages: 5 }

      app.get('/test', (c) => paginated(c, expenses, meta))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as PaginatedResponse<{ id: string }>

      expect(body.data).toEqual(expenses)
      expect(body.meta).toEqual(meta)
    })

    it('includes all pagination meta fields', async () => {
      const app = createTestApp()
      const meta = { page: 2, limit: 10, total: 50, totalPages: 5 }

      app.get('/test', (c) => paginated(c, [], meta))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as PaginatedResponse<unknown>

      expect(body.meta.page).toBe(2)
      expect(body.meta.limit).toBe(10)
      expect(body.meta.total).toBe(50)
      expect(body.meta.totalPages).toBe(5)
    })

    it('defaults to 200 status', async () => {
      const app = createTestApp()
      const meta = { page: 1, limit: 20, total: 0, totalPages: 0 }

      app.get('/test', (c) => paginated(c, [], meta))

      const res = await app.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })

    it('handles empty results with zero totals', async () => {
      const app = createTestApp()
      const meta = { page: 1, limit: 20, total: 0, totalPages: 0 }

      app.get('/test', (c) => paginated(c, [], meta))

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as PaginatedResponse<unknown>

      expect(body.data).toEqual([])
      expect(body.meta.total).toBe(0)
      expect(body.meta.totalPages).toBe(0)
    })
  })

  describe('error()', () => {
    it('returns { error: { code, message } } format', async () => {
      const app = createTestApp()

      app.get('/test', (c) =>
        error(c, ERROR_CODES.NOT_FOUND, 'Resource not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
      expect(body.error.message).toBe('Resource not found')
    })

    it('includes details when provided', async () => {
      const app = createTestApp()
      const details = { field: 'email', issue: 'invalid' }

      app.get('/test', (c) =>
        error(
          c,
          ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          HTTP_STATUS.BAD_REQUEST,
          details
        )
      )

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error.details).toEqual(details)
    })

    it('defaults to 400 status', async () => {
      const app = createTestApp()

      app.get('/test', (c) => error(c, ERROR_CODES.INVALID_INPUT, 'Bad input'))

      const res = await app.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('allows custom status code', async () => {
      const app = createTestApp()

      app.get('/test', (c) =>
        error(c, ERROR_CODES.INTERNAL_ERROR, 'Server error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )

      const res = await app.request('/test', { method: 'GET' })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })

    it('omits details when undefined', async () => {
      const app = createTestApp()

      app.get('/test', (c) =>
        error(c, ERROR_CODES.UNAUTHORIZED, 'Not authenticated', HTTP_STATUS.UNAUTHORIZED)
      )

      const res = await app.request('/test', { method: 'GET' })
      const body = (await res.json()) as ErrorResponse

      expect(body.error).toHaveProperty('code')
      expect(body.error).toHaveProperty('message')
      expect(body.error.details).toBeUndefined()
    })
  })
})
