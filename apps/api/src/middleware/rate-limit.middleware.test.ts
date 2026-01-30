import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../types'
import { rateLimitMiddleware } from './rate-limit.middleware'

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}))

const mockLimit = vi.fn()
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
    {
      tokenBucket: vi.fn(),
    }
  ),
}))

type ErrorResponse = { error: { code: string; message: string } }

const testEnv = {
  UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.use('*', rateLimitMiddleware)
  app.get('/test', (c) => c.json({ data: 'success' }))
  return app
}

describe('Rate Limit Middleware', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  it('allows request when under rate limit', async () => {
    mockLimit.mockResolvedValue({ success: true })

    const res = await app.request('/test', { method: 'GET' }, testEnv)

    expect(res.status).toBe(HTTP_STATUS.OK)
    expect(await res.json()).toEqual({ data: 'success' })
  })

  it('returns 429 when rate limit exceeded', async () => {
    mockLimit.mockResolvedValue({ success: false })

    const res = await app.request('/test', { method: 'GET' }, testEnv)
    const body = (await res.json()) as ErrorResponse

    expect(res.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS)
    expect(body.error.code).toBe(ERROR_CODES.RATE_LIMITED)
    expect(body.error.message).toBe('Too many requests. Please try again later.')
  })

  it('uses CF-Connecting-IP header for rate limiting', async () => {
    mockLimit.mockResolvedValue({ success: true })

    await app.request(
      '/test',
      {
        method: 'GET',
        headers: { 'CF-Connecting-IP': '192.168.1.1' },
      },
      testEnv
    )

    expect(mockLimit).toHaveBeenCalledWith('192.168.1.1')
  })

  it('falls back to unknown when no IP header', async () => {
    mockLimit.mockResolvedValue({ success: true })

    await app.request('/test', { method: 'GET' }, testEnv)

    expect(mockLimit).toHaveBeenCalledWith('unknown')
  })
})
