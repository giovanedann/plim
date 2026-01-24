import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../lib/env'

const RATE_LIMIT = 50
const WINDOW_SECONDS = 60

export const rateLimitMiddleware: MiddlewareHandler<{
  Bindings: Bindings
}> = async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || 'unknown'

  const redis = new Redis({
    url: c.env.UPSTASH_REDIS_REST_URL,
    token: c.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(RATE_LIMIT, `${WINDOW_SECONDS} s`, RATE_LIMIT),
  })

  const { success } = await ratelimit.limit(clientIP)

  if (!success) {
    return c.json(
      {
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests. Please try again later.',
        },
      },
      HTTP_STATUS.TOO_MANY_REQUESTS
    )
  }

  return next()
}
