import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MercadoPagoClient,
  type MpPaymentStatusResponse,
  type MpPixPaymentResponse,
  type MpPreApprovalResponse,
  type MpPreApprovalStatusResponse,
} from './mercado-pago-client'

const ACCESS_TOKEN = 'TEST-access-token-123'
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

    it('sends POST to /v1/payments with correct headers and body', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment('user@email.com', 29.9)

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/v1/payments`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('includes payer email, amount, pix method, and expiration in the body', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      await sut.createPixPayment('user@email.com', 29.9)

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body).toMatchObject({
        transaction_amount: 29.9,
        payment_method_id: 'pix',
        payer: { email: 'user@email.com' },
        description: 'Plim Pro - 30 dias',
      })
      expect(body.date_of_expiration).toBeDefined()
    })

    it('returns the parsed API response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(pixResponse))

      const result = await sut.createPixPayment('user@email.com', 29.9)

      expect(result).toEqual(pixResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'invalid_token' }, false, 401)
      )

      await expect(sut.createPixPayment('user@email.com', 29.9)).rejects.toThrow(
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

    it('sends GET to /v1/payments/:id with auth header', async () => {
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

  describe('createCardSubscription', () => {
    const subscriptionResponse: MpPreApprovalResponse = {
      id: 'sub-abc-123',
      status: 'pending',
      init_point:
        'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=sub-abc-123',
      payer_id: 98765,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 29.9,
        currency_id: 'BRL',
      },
    }

    it('sends POST to /preapproval with subscription body', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(subscriptionResponse))

      await sut.createCardSubscription('user@email.com', 29.9)

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/preapproval`,
        expect.objectContaining({ method: 'POST' })
      )

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body).toEqual({
        reason: 'Plim Pro - Assinatura mensal',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 29.9,
          currency_id: 'BRL',
        },
        payer_email: 'user@email.com',
        back_url: 'https://plim.app.br/upgrade',
        status: 'pending',
      })
    })

    it('returns the parsed subscription response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(subscriptionResponse))

      const result = await sut.createCardSubscription('user@email.com', 29.9)

      expect(result).toEqual(subscriptionResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'bad_request' }, false, 400)
      )

      await expect(sut.createCardSubscription('user@email.com', 29.9)).rejects.toThrow(
        'Mercado Pago API error: 400'
      )
    })
  })

  describe('getSubscriptionStatus', () => {
    const statusResponse: MpPreApprovalStatusResponse = {
      id: 'sub-abc-123',
      status: 'authorized',
      payer_id: 98765,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 29.9,
        currency_id: 'BRL',
      },
      next_payment_date: '2026-03-06T10:00:00.000Z',
    }

    it('sends GET to /preapproval/:id with auth header', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(statusResponse))

      await sut.getSubscriptionStatus('sub-abc-123')

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/preapproval/sub-abc-123`,
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

    it('returns the parsed subscription status', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(statusResponse))

      const result = await sut.getSubscriptionStatus('sub-abc-123')

      expect(result).toEqual(statusResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'not_found' }, false, 404)
      )

      await expect(sut.getSubscriptionStatus('invalid-id')).rejects.toThrow(
        'Mercado Pago API error: 404'
      )
    })
  })

  describe('cancelSubscription', () => {
    const cancelledResponse: MpPreApprovalStatusResponse = {
      id: 'sub-abc-123',
      status: 'cancelled',
      payer_id: 98765,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 29.9,
        currency_id: 'BRL',
      },
      next_payment_date: null,
    }

    it('sends PUT to /preapproval/:id with cancelled status', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(cancelledResponse))

      await sut.cancelSubscription('sub-abc-123')

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/preapproval/sub-abc-123`,
        expect.objectContaining({ method: 'PUT' })
      )

      const call = vi.mocked(global.fetch).mock.calls[0]!
      const body = JSON.parse(call[1]?.body as string)

      expect(body).toEqual({ status: 'cancelled' })
    })

    it('returns the parsed cancellation response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(createFetchResponse(cancelledResponse))

      const result = await sut.cancelSubscription('sub-abc-123')

      expect(result).toEqual(cancelledResponse)
    })

    it('throws when the API returns a non-ok response', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        createFetchResponse({ message: 'forbidden' }, false, 403)
      )

      await expect(sut.cancelSubscription('sub-abc-123')).rejects.toThrow(
        'Mercado Pago API error: 403'
      )
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

      await expect(sut.createPixPayment('user@email.com', 29.9)).rejects.toThrow(
        'insufficient_funds'
      )
    })
  })
})
