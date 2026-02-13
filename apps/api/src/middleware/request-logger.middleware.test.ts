import { Logtail } from '@logtail/edge'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { requestLoggerMiddleware } from './request-logger.middleware'

vi.mock('@logtail/edge')

const mockInfo = vi.fn()
const mockWarn = vi.fn()
const mockError = vi.fn()
const mockFlush = vi.fn().mockResolvedValue(undefined)

const testEnv = { BETTERSTACK_SOURCE_TOKEN: 'test-token' } as Env['Bindings']

function createTestApp(): Hono<Env> {
  const app = new Hono<Env>()
  app.use('*', requestLoggerMiddleware)
  return app
}

describe('requestLoggerMiddleware', () => {
  let sut: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(Logtail).mockImplementation(
      () =>
        ({
          info: mockInfo,
          warn: mockWarn,
          error: mockError,
          flush: mockFlush,
        }) as unknown as Logtail
    )

    sut = createTestApp()
  })

  describe('when token is configured', () => {
    it('logs successful requests with info level', async () => {
      sut.get('/test', (c) => c.json({ ok: true }))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockInfo).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          status: 200,
        })
      )
    })

    it('logs 4xx responses with warn level', async () => {
      sut.get('/test', (c) => c.json({ error: 'not found' }, 404))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockWarn).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          status: 404,
        })
      )
    })

    it('logs 5xx responses with error level', async () => {
      sut.get('/test', (c) => c.json({ error: 'internal' }, 500))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockError).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          method: 'GET',
          path: '/test',
          status: 500,
        })
      )
    })

    it('includes duration_ms in log data', async () => {
      sut.get('/test', (c) => c.json({ ok: true }))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockInfo).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          duration_ms: expect.any(Number),
        })
      )
    })

    it('includes user_id when set by auth middleware', async () => {
      sut.use('*', async (c, next) => {
        c.set('userId' as never, 'user-123' as never)
        return next()
      })
      sut.get('/test', (c) => c.json({ ok: true }))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockInfo).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          user_id: 'user-123',
        })
      )
    })

    it('logs undefined user_id for unauthenticated requests', async () => {
      sut.get('/test', (c) => c.json({ ok: true }))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockInfo).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          user_id: undefined,
        })
      )
    })

    it('flushes logger after logging', async () => {
      sut.get('/test', (c) => c.json({ ok: true }))

      await sut.request('/test', { method: 'GET' }, testEnv)

      expect(mockFlush).toHaveBeenCalledOnce()
    })

    it('logs POST requests correctly', async () => {
      sut.post('/expenses', (c) => c.json({ id: '1' }, 201))

      await sut.request('/expenses', { method: 'POST' }, testEnv)

      expect(mockInfo).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({
          method: 'POST',
          path: '/expenses',
          status: 201,
        })
      )
    })
  })

  describe('when token is not configured', () => {
    it('skips logging and proceeds normally', async () => {
      sut.get('/test', (c) => c.json({ ok: true }))

      const res = await sut.request('/test', { method: 'GET' }, {
        BETTERSTACK_SOURCE_TOKEN: '',
      } as Env['Bindings'])

      expect(res.status).toBe(200)
      expect(vi.mocked(Logtail)).not.toHaveBeenCalled()
    })
  })
})
