import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { createClient } from '@supabase/supabase-js'
import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../lib/env'

export type AuthVariables = {
  userId: string
  accessToken: string
}

export const authMiddleware: MiddlewareHandler<{
  Bindings: Bindings
  Variables: AuthVariables
}> = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Missing or invalid authorization header',
        },
      },
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  const accessToken = authHeader.slice(7)

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken)

  if (error || !user) {
    return c.json(
      {
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or expired token',
        },
      },
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  c.set('userId', user.id)
  c.set('accessToken', accessToken)

  await next()
}
