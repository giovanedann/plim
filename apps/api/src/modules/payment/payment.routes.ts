import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { error, success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import {
  type PaymentDependencies,
  createPaymentDependencies,
  createWebhookDependencies,
} from './payment.factory'

type PaymentEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { paymentDeps: PaymentDependencies }
}

type WebhookEnv = {
  Bindings: Bindings
}

export function createPaymentRouter(): Hono<PaymentEnv> {
  const router = new Hono<PaymentEnv>()

  router.use('*', async (c, next) => {
    const deps = createPaymentDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('paymentDeps', deps)
    await next()
  })

  router.post('/pix', async (c) => {
    const deps = c.get('paymentDeps')
    const userId = c.get('userId')

    const email = await getUserEmail(deps, userId)
    if (!email) {
      return error(c, ERROR_CODES.NOT_FOUND, 'Perfil nao encontrado', HTTP_STATUS.NOT_FOUND)
    }

    const result = await deps.createPixPayment.execute(userId, email)
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.post('/card', async (c) => {
    const deps = c.get('paymentDeps')
    const userId = c.get('userId')

    const email = await getUserEmail(deps, userId)
    if (!email) {
      return error(c, ERROR_CODES.NOT_FOUND, 'Perfil nao encontrado', HTTP_STATUS.NOT_FOUND)
    }

    const result = await deps.createCardSubscription.execute(userId, email)
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.get('/status', async (c) => {
    const deps = c.get('paymentDeps')
    const userId = c.get('userId')

    const result = await deps.getSubscriptionStatus.execute(userId)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/cancel', async (c) => {
    const deps = c.get('paymentDeps')
    const userId = c.get('userId')

    const result = await deps.cancelSubscription.execute(userId)
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export function createWebhookRouter(): Hono<WebhookEnv> {
  const router = new Hono<WebhookEnv>()

  router.post('/mercadopago', async (c) => {
    const deps = createWebhookDependencies(c.env)
    const body = await c.req.json()

    const signature = c.req.header('x-signature')
    const requestId = c.req.header('x-request-id')

    const isValid = await verifyWebhookSignature(
      signature,
      requestId,
      body.data?.id,
      c.env.MERCADO_PAGO_WEBHOOK_SECRET
    )

    if (!isValid) {
      return error(
        c,
        ERROR_CODES.UNAUTHORIZED,
        'Invalid webhook signature',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    await deps.handleWebhook.execute(body)

    return c.json({ received: true }, 200)
  })

  return router
}

async function getUserEmail(deps: PaymentDependencies, userId: string): Promise<string | null> {
  const { data } = await deps.supabase
    .from('profile')
    .select('email')
    .eq('user_id', userId)
    .single()

  return data?.email ?? null
}

async function verifyWebhookSignature(
  signature: string | undefined,
  requestId: string | undefined,
  dataId: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false

  // MP sends: ts=xxx,v1=hash
  const parts = signature.split(',')
  const tsEntry = parts.find((p) => p.startsWith('ts='))
  const v1Entry = parts.find((p) => p.startsWith('v1='))

  if (!tsEntry || !v1Entry) return false

  const ts = tsEntry.split('=')[1]
  const expectedHash = v1Entry.split('=')[1]

  if (!ts || !expectedHash) return false

  // Build manifest string per MP docs
  const manifest = `id:${dataId ?? ''};request-id:${requestId ?? ''};ts:${ts};`

  // HMAC-SHA256 using Web Crypto API (Cloudflare Workers compatible)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))

  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computedHash === expectedHash
}

export const paymentRouter = createPaymentRouter()
export const webhookRouter = createWebhookRouter()
