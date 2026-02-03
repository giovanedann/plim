import { sValidator } from '@hono/standard-validator'
import { ERROR_CODES, HTTP_STATUS, aiChatRequestSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/error-handler.middleware'
import { type AIDependencies, createAIDependencies } from './ai.factory'
import type { ContentPart } from './client'

export type AIEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { aiDeps: AIDependencies }
}

export function createAIRouter(): Hono<AIEnv> {
  const router = new Hono<AIEnv>()

  router.use('*', async (c, next) => {
    try {
      const deps = createAIDependencies({
        env: c.env,
        accessToken: c.get('accessToken'),
      })
      c.set('aiDeps', deps)
      await next()
    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'AI service is not configured',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      }
      throw error
    }
  })

  router.get('/usage', async (c) => {
    const deps = c.get('aiDeps')
    const userId = c.get('userId')

    const usageInfo = await deps.getUsageInfo.execute(userId)

    return success(c, usageInfo, HTTP_STATUS.OK)
  })

  router.post('/chat', sValidator('json', aiChatRequestSchema), async (c) => {
    const deps = c.get('aiDeps')
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const { allowed, usageInfo } = await deps.checkUsageLimit.execute(userId)

    if (!allowed) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Limite de requisições AI atingido para este mês',
        HTTP_STATUS.FORBIDDEN,
        { usageInfo }
      )
    }

    const requestType = detectRequestType(body.messages)

    const result = await deps.chat.execute(userId, {
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.content as ContentPart[],
      })),
      requestType,
    })

    const updatedUsageInfo = await deps.getUsageInfo.execute(userId)

    return success(
      c,
      {
        message: result.message,
        action: result.action,
        usageInfo: updatedUsageInfo,
      },
      HTTP_STATUS.OK
    )
  })

  return router
}

function detectRequestType(
  messages: Array<{ content: Array<{ type: string }> }>
): 'text' | 'voice' | 'image' {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) return 'text'

  for (const part of lastMessage.content) {
    if (part.type === 'audio') return 'voice'
    if (part.type === 'image') return 'image'
  }

  return 'text'
}

export function createAIRouterWithDeps(deps: AIDependencies): Hono<AIEnv> {
  const router = new Hono<AIEnv>()

  router.get('/usage', async (c) => {
    const userId = c.get('userId')
    const usageInfo = await deps.getUsageInfo.execute(userId)
    return success(c, usageInfo, HTTP_STATUS.OK)
  })

  router.post('/chat', sValidator('json', aiChatRequestSchema), async (c) => {
    const userId = c.get('userId')
    const body = c.req.valid('json')

    const { allowed, usageInfo } = await deps.checkUsageLimit.execute(userId)

    if (!allowed) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Limite de requisições AI atingido para este mês',
        HTTP_STATUS.FORBIDDEN,
        { usageInfo }
      )
    }

    const requestType = detectRequestType(body.messages)

    const result = await deps.chat.execute(userId, {
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.content as ContentPart[],
      })),
      requestType,
    })

    const updatedUsageInfo = await deps.getUsageInfo.execute(userId)

    return success(
      c,
      {
        message: result.message,
        action: result.action,
        usageInfo: updatedUsageInfo,
      },
      HTTP_STATUS.OK
    )
  })

  return router
}

export const aiRouter = createAIRouter()
