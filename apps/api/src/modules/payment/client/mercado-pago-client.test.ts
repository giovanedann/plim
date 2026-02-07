import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type CreatePixPaymentParams,
  MercadoPagoClient,
  type MpPaymentStatusResponse,
  type MpPixPaymentResponse,
} from './mercado-pago-client'

const ACCESS_TOKEN = 'TEST-payments-token-123'
const BASE_URL = 'https://api.mercadopago.com'

function createFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}

function createDefaultParams(overrides?: Partial<CreatePixPaymentParams>): CreatePixPaymentParams {
  return {
    email: 'user@email.com',
    amountBrl: 29.9,
    notificationUrl: 'https://api.plim.app.br/api/v1/webhooks/mercadopago',
    externalReference: 'plim-pro-user-1',
    statementDescriptor: 'PLIM PRO',
    firstName: 'Joao',
    lastName: 'Silva',
    ...overrides,
  }
}

describe('MercadoPagoClient', () => {
  let sut: MercadoPagoClient

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    sut = new MercadoPagoClient(ACCESS_TOKEN)
  })

  describe('createPixPayment', () => {
    const pixResponse: MpPixPaymentResponse = {
      id: 12345,
      status: 'pending',
      point_of_interaction: {
        transaction_data: {
          qr_code_base64: 'base64-qr-code',
          qr_code: 'pix-copy-paste-code',
        },
      },
      date_of_expiration: '2026-02-06T12:30:00.000Z',
    }

    it('sends POST to /v1/payments with access token and idempotency key', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment(createDefaultParams())

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payments`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': expect.stringContaining('pix-user@email.com-29.9-'),
          }),
        })
      )
    })

    it('includes all enriched fields in the body', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment(createDefaultParams())

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body).toMatchObject({
        transaction_amount: 29.9,
        payment_method_id: 'pix',
        payer: { email: 'user@email.com', first_name: 'Joao', last_name: 'Silva' },
        description: 'Plim Pro - 30 dias',
        notification_url: 'https://api.plim.app.br/api/v1/webhooks/mercadopago',
        external_reference: 'plim-pro-user-1',
        statement_descriptor: 'PLIM PRO',
        additional_info: {
          items: [
            {
              id: 'plim-pro-30d',
              title: 'Plim Pro - 30 dias',
              description: 'Assinatura Plim Pro por 30 dias',
              category_id: 'services',
              quantity: 1,
              unit_price: 29.9,
            },
          ],
        },
      })
      expect(body.date_of_expiration).toBeDefined()
    })

    it('omits notification_url when notificationUrl is undefined', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment(createDefaultParams({ notificationUrl: undefined }))

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body.notification_url).toBeUndefined()
    })

    it('omits first_name and last_name when undefined', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment(createDefaultParams({ firstName: undefined, lastName: undefined }))

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body.payer).toEqual({ email: 'user@email.com' })
      expect(body.payer.first_name).toBeUndefined()
      expect(body.payer.last_name).toBeUndefined()
    })

    it('returns the parsed API response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      const result = await sut.createPixPayment(createDefaultParams())

      expect(result).toEqual(pixResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'invalid_token' }, false, 401)
      )

      await expect(sut.createPixPayment(createDefaultParams())).rejects.toThrow(
        'Mercado Pago API error: 401'
      )
    })
  })

  describe('getPaymentStatus', () => {
    const statusResponse: MpPaymentStatusResponse = {
      id: 12345,
      status: 'approved',
      status_detail: 'accredited',
      payer: { email: 'user@email.com' },
      transaction_amount: 29.9,
      date_approved: '2026-02-06T10:00:00.000Z',
    }

    it('sends GET to /v1/payments/:id with access token', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(statusResponse))

      await sut.getPaymentStatus('12345')

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payments/12345`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: undefined,
        })
      )
    })

    it('returns the parsed payment status', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(statusResponse))

      const result = await sut.getPaymentStatus('12345')

      expect(result).toEqual(statusResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'not_found' }, false, 404)
      )

      await expect(sut.getPaymentStatus('99999')).rejects.toThrow('Mercado Pago API error: 404')
    })
  })

  describe('error handling', () => {
    it('includes status code and response body in error message', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'invalid_token', status: 401 }, false, 401)
      )

      await expect(sut.getPaymentStatus('123')).rejects.toThrow(
        /Mercado Pago API error: 401 Bad Request/
      )
    })

    it('includes error body text in the thrown error', async () => {
      const errorBody = { message: 'insufficient_funds', cause: 'card_declined' }
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(errorBody, false, 402))

      await expect(sut.createPixPayment(createDefaultParams())).rejects.toThrow(
        'insufficient_funds'
      )
    })
  })
})
