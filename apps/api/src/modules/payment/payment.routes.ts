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

    const profile = await getUserProfile(deps, userId)
    if (!profile) {
      return error(c, ERROR_CODES.NOT_FOUND, 'Perfil nao encontrado', HTTP_STATUS.NOT_FOUND)
    }

    const result = await deps.createPixPayment.execute(userId, profile)
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.get('/status', async (c) => {
    const deps = c.get('paymentDeps')
    const userId = c.get('userId')

    const result = await deps.getSubscriptionStatus.execute(userId)
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

    const isValid = await verifyWebhookSignature(signature, requestId, body.data?.id, [
      c.env.MERCADO_PAGO_WEBHOOK_SECRET,
    ])

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

async function getUserProfile(
  deps: PaymentDependencies,
  userId: string
): Promise<{ email: string; name: string | null } | null> {
  const { data } = await deps.supabase
    .from('profile')
    .select('email, name')
    .eq('user_id', userId)
    .single()

  if (!data?.email) return null
  return { email: data.email, name: data.name ?? null }
}

async function verifyWebhookSignature(
  signature: string | undefined,
  requestId: string | undefined,
  dataId: string | undefined,
  secrets: string[]
): Promise<boolean> {
  if (!signature || secrets.length === 0) return false

  const parts = signature.split(',')
  const tsEntry = parts.find((p) => p.startsWith('ts='))
  const v1Entry = parts.find((p) => p.startsWith('v1='))

  if (!tsEntry || !v1Entry) return false

  const ts = tsEntry.split('=')[1]
  const expectedHash = v1Entry.split('=')[1]

  if (!ts || !expectedHash) return false

  const manifest = `id:${dataId ?? ''};request-id:${requestId ?? ''};ts:${ts};`
  const encoder = new TextEncoder()

  for (const secret of secrets) {
    if (!secret) continue

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

    if (computedHash === expectedHash) return true
  }

  return false
}

export function createPaymentRouterWithDeps(deps: PaymentDependencies): Hono<PaymentEnv> {
  const router = new Hono<PaymentEnv>()

  router.use('*', async (c, next) => {
    c.set('paymentDeps', deps)
    await next()
  })

  router.post('/pix', async (c) => {
    const d = c.get('paymentDeps')
    const userId = c.get('userId')

    const profile = await getUserProfile(d, userId)
    if (!profile) {
      return error(c, ERROR_CODES.NOT_FOUND, 'Perfil nao encontrado', HTTP_STATUS.NOT_FOUND)
    }

    const result = await d.createPixPayment.execute(userId, profile)
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.get('/status', async (c) => {
    const d = c.get('paymentDeps')
    const userId = c.get('userId')

    const result = await d.getSubscriptionStatus.execute(userId)
    return success(c, result, HTTP_STATUS.OK)
  })

  return router
}

export interface WebhookTestDependencies {
  handleWebhook: { execute: (payload: unknown) => Promise<void> }
  verifySignature?: (
    signature: string | undefined,
    requestId: string | undefined,
    dataId: string | undefined,
    secrets: string[]
  ) => Promise<boolean>
}

export function createWebhookRouterWithDeps(
  deps: WebhookTestDependencies,
  secrets: string[] = ['test-secret']
): Hono<WebhookEnv> {
  const router = new Hono<WebhookEnv>()

  router.post('/mercadopago', async (c) => {
    const body = await c.req.json()

    const signature = c.req.header('x-signature')
    const requestId = c.req.header('x-request-id')

    const verify = deps.verifySignature ?? verifyWebhookSignature
    const isValid = await verify(signature, requestId, body.data?.id, secrets)

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

export { verifyWebhookSignature }

export const paymentRouter = createPaymentRouter()
export const webhookRouter = createWebhookRouter()
