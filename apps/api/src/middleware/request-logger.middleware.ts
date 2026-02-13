import { Logtail } from '@logtail/edge'
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types'

export const requestLoggerMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const sourceToken = c.env?.BETTERSTACK_SOURCE_TOKEN
  if (!sourceToken) {
    return next()
  }

  const start = Date.now()

  await next()

  const duration = Date.now() - start
  const status = c.res.status
  const method = c.req.method
  const path = c.req.path
  const userId = c.get('userId' as never) as string | undefined

  const logger = new Logtail(sourceToken)

  const logData = {
    method,
    path,
    status,
    duration_ms: duration,
    user_id: userId,
  }

  if (status >= 500) {
    logger.error('request', logData)
  } else if (status >= 400) {
    logger.warn('request', logData)
  } else {
    logger.info('request', logData)
  }

  const flushPromise = logger.flush()
  try {
    c.executionCtx.waitUntil(flushPromise)
  } catch {
    // executionCtx unavailable outside Cloudflare Workers (e.g. tests)
  }
}
