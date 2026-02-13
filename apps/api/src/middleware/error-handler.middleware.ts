import { Logtail } from '@logtail/edge'
import { type ApiError, ERROR_CODES, HTTP_STATUS, type HttpErrorStatus } from '@plim/shared'
import type { ErrorHandler } from 'hono'
import { ZodError } from 'zod'
import type { Env } from '../types'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: HttpErrorStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler: ErrorHandler<Env> = (err, c) => {
  if (err instanceof AppError) {
    return c.json<{ error: ApiError }>(
      {
        error: {
          code: err.code as ApiError['code'],
          message: err.message,
          details: err.details,
        },
      },
      err.status
    )
  }

  if (err instanceof ZodError) {
    return c.json<{ error: ApiError }>(
      {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: err.flatten(),
        },
      },
      HTTP_STATUS.BAD_REQUEST
    )
  }

  const sourceToken = c.env?.BETTERSTACK_SOURCE_TOKEN
  if (sourceToken) {
    const logger = new Logtail(sourceToken)
    logger.error('Unhandled API error', {
      message: err.message,
      stack: err.stack,
    })
    try {
      c.executionCtx.waitUntil(logger.flush())
    } catch {
      // executionCtx is unavailable outside Cloudflare Workers (e.g. tests)
    }
  }
  console.error('Unhandled error:', err)

  return c.json<{ error: ApiError }>(
    {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  )
}
