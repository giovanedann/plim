import {
  ERROR_CODES,
  HTTP_STATUS,
  type PixPaymentResponse,
  type SubscriptionStatusResponse,
} from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { Env } from '../../types'
import type { PaymentDependencies } from './payment.factory'
import {
  type WebhookTestDependencies,
  createPaymentRouterWithDeps,
  createWebhookRouterWithDeps,
  verifyWebhookSignature,
} from './payment.routes'

const mockCreatePixPayment = { execute: vi.fn() }
const mockGetSubscriptionStatus = { execute: vi.fn() }

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { email: 'user@email.com', name: 'Test User' },
          error: null,
        }),
      }),
    }),
  }),
}

const mockDependencies = {
  repository: {},
  mpClient: {},
  supabase: mockSupabase,
  createPixPayment: mockCreatePixPayment,
  getSubscriptionStatus: mockGetSubscriptionStatus,
} as unknown as PaymentDependencies

describe('Payment Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'user@email.com', name: 'Test User' },
            error: null,
          }),
        }),
      }),
    })

    app = createIntegrationApp(TEST_USER_ID)
    const router = createPaymentRouterWithDeps(mockDependencies)
    app.route('/payment', router)
  })

  describe('POST /payment/pix - Create PIX payment', () => {
    const pixResponse: PixPaymentResponse = {
      qr_code_base64: 'base64-qr-image',
      pix_copia_cola: '00020126360014br.gov.bcb.pix...',
      mp_payment_id: '12345',
      expires_at: '2026-02-06T13:00:00.000Z',
    }

    it('returns 201 with QR code data', async () => {
      mockCreatePixPayment.execute.mockResolvedValue(pixResponse)

      const res = await app.request('/payment/pix', { method: 'POST' })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: PixPaymentResponse }
      expect(body.data.qr_code_base64).toBe('base64-qr-image')
      expect(body.data.pix_copia_cola).toBe('00020126360014br.gov.bcb.pix...')
      expect(body.data.mp_payment_id).toBe('12345')
      expect(body.data.expires_at).toBeDefined()
    })

    it('passes userId and email to use case', async () => {
      mockCreatePixPayment.execute.mockResolvedValue(pixResponse)

      await app.request('/payment/pix', { method: 'POST' })

      expect(mockCreatePixPayment.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        email: 'user@email.com',
        name: 'Test User',
      })
    })

    it('returns 404 when user profile not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const res = await app.request('/payment/pix', { method: 'POST' })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })
  })

  describe('GET /payment/status - Subscription status', () => {
    it('returns 200 with free tier status', async () => {
      const status: SubscriptionStatusResponse = {
        tier: 'free',
        payment_method: null,
        current_period_start: null,
        current_period_end: null,
        mp_payment_status: null,
        is_expiring_soon: false,
        days_remaining: null,
      }
      mockGetSubscriptionStatus.execute.mockResolvedValue(status)

      const res = await app.request('/payment/status')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SubscriptionStatusResponse }
      expect(body.data.tier).toBe('free')
      expect(body.data.payment_method).toBeNull()
    })

    it('returns 200 with active Pro PIX status', async () => {
      const status: SubscriptionStatusResponse = {
        tier: 'pro',
        payment_method: 'pix',
        current_period_start: '2026-02-01T00:00:00.000Z',
        current_period_end: '2026-03-03T00:00:00.000Z',
        mp_payment_status: 'approved',
        is_expiring_soon: false,
        days_remaining: 25,
      }
      mockGetSubscriptionStatus.execute.mockResolvedValue(status)

      const res = await app.request('/payment/status')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SubscriptionStatusResponse }
      expect(body.data.tier).toBe('pro')
      expect(body.data.payment_method).toBe('pix')
      expect(body.data.days_remaining).toBe(25)
      expect(body.data.is_expiring_soon).toBe(false)
    })

    it('returns 200 with expiring soon Pro status', async () => {
      const status: SubscriptionStatusResponse = {
        tier: 'pro',
        payment_method: 'pix',
        current_period_start: '2026-01-07T00:00:00.000Z',
        current_period_end: '2026-02-06T00:00:00.000Z',
        mp_payment_status: 'approved',
        is_expiring_soon: true,
        days_remaining: 3,
      }
      mockGetSubscriptionStatus.execute.mockResolvedValue(status)

      const res = await app.request('/payment/status')

      const body = (await res.json()) as { data: SubscriptionStatusResponse }
      expect(body.data.is_expiring_soon).toBe(true)
      expect(body.data.days_remaining).toBe(3)
    })

    it('passes userId to use case', async () => {
      const status: SubscriptionStatusResponse = {
        tier: 'free',
        payment_method: null,
        current_period_start: null,
        current_period_end: null,
        mp_payment_status: null,
        is_expiring_soon: false,
        days_remaining: null,
      }
      mockGetSubscriptionStatus.execute.mockResolvedValue(status)

      await app.request('/payment/status')

      expect(mockGetSubscriptionStatus.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })
  })
})

describe('Webhook Integration', () => {
  const mockHandleWebhook = { execute: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /mercadopago - Webhook handler', () => {
    it('returns 200 with valid signature and PIX payment event', async () => {
      const webhookApp = new Hono<Env>()
      webhookApp.onError(errorHandler)
      const webhookDeps: WebhookTestDependencies = {
        handleWebhook: mockHandleWebhook,
        verifySignature: vi.fn().mockResolvedValue(true),
      }
      const router = createWebhookRouterWithDeps(webhookDeps)
      webhookApp.route('/webhooks', router)

      mockHandleWebhook.execute.mockResolvedValue(undefined)

      const res = await webhookApp.request('/webhooks/mercadopago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': 'ts=1234,v1=validhash',
          'x-request-id': 'req-123',
        },
        body: JSON.stringify({
          type: 'payment',
          action: 'payment.updated',
          data: { id: '12345' },
        }),
      })

      expect(res.status).toBe(200)
      const body = (await res.json()) as { received: boolean }
      expect(body.received).toBe(true)
      expect(mockHandleWebhook.execute).toHaveBeenCalledWith({
        type: 'payment',
        action: 'payment.updated',
        data: { id: '12345' },
      })
    })

    it('returns 401 when signature is invalid', async () => {
      const webhookApp = new Hono<Env>()
      webhookApp.onError(errorHandler)
      const webhookDeps: WebhookTestDependencies = {
        handleWebhook: mockHandleWebhook,
        verifySignature: vi.fn().mockResolvedValue(false),
      }
      const router = createWebhookRouterWithDeps(webhookDeps)
      webhookApp.route('/webhooks', router)

      const res = await webhookApp.request('/webhooks/mercadopago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': 'ts=1234,v1=invalidhash',
          'x-request-id': 'req-789',
        },
        body: JSON.stringify({
          type: 'payment',
          action: 'payment.updated',
          data: { id: '12345' },
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(mockHandleWebhook.execute).not.toHaveBeenCalled()
    })

    it('returns 401 when signature header is missing', async () => {
      const webhookApp = new Hono<Env>()
      webhookApp.onError(errorHandler)
      const webhookDeps: WebhookTestDependencies = {
        handleWebhook: mockHandleWebhook,
      }
      const router = createWebhookRouterWithDeps(webhookDeps)
      webhookApp.route('/webhooks', router)

      const res = await webhookApp.request('/webhooks/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          action: 'payment.updated',
          data: { id: '12345' },
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(mockHandleWebhook.execute).not.toHaveBeenCalled()
    })
  })
})

describe('verifyWebhookSignature', () => {
  const SECRET = 'test-webhook-secret'

  async function generateSignature(
    dataId: string,
    requestId: string,
    ts: string,
    secret: string
  ): Promise<string> {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest))
    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  it('returns true for valid signature', async () => {
    const ts = '1706745600'
    const dataId = '12345'
    const requestId = 'req-abc'
    const hash = await generateSignature(dataId, requestId, ts, SECRET)

    const result = await verifyWebhookSignature(`ts=${ts},v1=${hash}`, requestId, dataId, [SECRET])

    expect(result).toBe(true)
  })

  it('returns true when signature matches second secret', async () => {
    const ts = '1706745600'
    const dataId = '12345'
    const requestId = 'req-abc'
    const secondSecret = 'other-webhook-secret'
    const hash = await generateSignature(dataId, requestId, ts, secondSecret)

    const result = await verifyWebhookSignature(`ts=${ts},v1=${hash}`, requestId, dataId, [
      'wrong-secret',
      secondSecret,
    ])

    expect(result).toBe(true)
  })

  it('returns false for invalid signature', async () => {
    const result = await verifyWebhookSignature('ts=1234,v1=invalidhash', 'req-123', '12345', [
      SECRET,
    ])

    expect(result).toBe(false)
  })

  it('returns false when signature header is undefined', async () => {
    const result = await verifyWebhookSignature(undefined, 'req-123', '12345', [SECRET])

    expect(result).toBe(false)
  })

  it('returns false when secrets array is empty', async () => {
    const result = await verifyWebhookSignature('ts=1234,v1=hash', 'req-123', '12345', [])

    expect(result).toBe(false)
  })

  it('returns false when signature format is malformed', async () => {
    const result = await verifyWebhookSignature('malformed-signature', 'req-123', '12345', [SECRET])

    expect(result).toBe(false)
  })

  it('returns false when ts is missing', async () => {
    const result = await verifyWebhookSignature('v1=somehash', 'req-123', '12345', [SECRET])

    expect(result).toBe(false)
  })

  it('returns false when v1 is missing', async () => {
    const result = await verifyWebhookSignature('ts=1234', 'req-123', '12345', [SECRET])

    expect(result).toBe(false)
  })
})
