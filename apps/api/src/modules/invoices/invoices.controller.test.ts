import {
  type ApiError,
  type CreditCardLimitUsage,
  ERROR_CODES,
  type Expense,
  HTTP_STATUS,
  type Invoice,
  createMockExpense,
  createMockInvoice,
} from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { GetCreditCardLimitUsageUseCase } from './get-credit-card-limit-usage.usecase'
import { GetOrCreateInvoiceUseCase } from './get-or-create-invoice.usecase'
import { invoicesController } from './invoices.controller'
import { InvoicesRepository } from './invoices.repository'
import { PayInvoiceUseCase } from './pay-invoice.usecase'

vi.mock('./get-or-create-invoice.usecase')
vi.mock('./pay-invoice.usecase')
vi.mock('./get-credit-card-limit-usage.usecase')
vi.mock('./invoices.repository')
vi.mock('../../lib/check-pro-feature', () => ({
  checkProFeature: vi.fn().mockResolvedValue(undefined),
}))

type SuccessResponse<T> = { data: T }
type ErrorResponse = { error: ApiError }

const USER_ID = '33333333-3333-4333-8333-333333333333'
const CARD_ID = '44444444-4444-4444-8444-444444444444'
const INVOICE_ID = '55555555-5555-5555-8555-555555555555'

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

function createTestApp(): Hono<Env> {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', USER_ID)
    c.set('accessToken', 'test-token')
    await next()
  })
  app.route('/invoices', invoicesController)
  return app
}

describe('Invoices Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /invoices/:creditCardId', () => {
    it('returns list of invoices for a credit card', async () => {
      const invoice = createMockInvoice({
        id: INVOICE_ID,
        user_id: USER_ID,
        credit_card_id: CARD_ID,
      })
      const mockFindByCard = vi.fn().mockResolvedValue([invoice])
      vi.mocked(InvoicesRepository).mockImplementation(
        () => ({ findByCard: mockFindByCard }) as unknown as InvoicesRepository
      )

      const res = await app.request(`/invoices/${CARD_ID}`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<Invoice[]>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toHaveLength(1)
      expect(body.data[0]!.credit_card_id).toBe(CARD_ID)
    })

    it('returns empty array when no invoices', async () => {
      const mockFindByCard = vi.fn().mockResolvedValue([])
      vi.mocked(InvoicesRepository).mockImplementation(
        () => ({ findByCard: mockFindByCard }) as unknown as InvoicesRepository
      )

      const res = await app.request(`/invoices/${CARD_ID}`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<Invoice[]>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toHaveLength(0)
    })
  })

  describe('GET /invoices/:creditCardId/limit-usage', () => {
    it('returns limit usage for a credit card', async () => {
      const limitUsage: CreditCardLimitUsage = {
        credit_card_id: CARD_ID,
        credit_limit_cents: 500000,
        used_cents: 150000,
        available_cents: 350000,
        recurrent_commitment_cents: 0,
      }
      const mockExecute = vi.fn().mockResolvedValue(limitUsage)
      vi.mocked(GetCreditCardLimitUsageUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetCreditCardLimitUsageUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/limit-usage`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<CreditCardLimitUsage>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.credit_card_id).toBe(CARD_ID)
      expect(body.data.available_cents).toBe(350000)
    })

    it('returns 404 when credit card not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(GetCreditCardLimitUsageUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetCreditCardLimitUsageUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/limit-usage`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })

    it('returns 400 when credit card has no limit', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            'Credit card has no limit set',
            HTTP_STATUS.BAD_REQUEST
          )
        )
      vi.mocked(GetCreditCardLimitUsageUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetCreditCardLimitUsageUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/limit-usage`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    })
  })

  describe('GET /invoices/:creditCardId/:referenceMonth', () => {
    it('returns invoice with transactions', async () => {
      const invoice = createMockInvoice({
        id: INVOICE_ID,
        user_id: USER_ID,
        credit_card_id: CARD_ID,
        reference_month: '2026-01',
      })
      const transactions = [
        createMockExpense({
          user_id: USER_ID,
          credit_card_id: CARD_ID,
          amount_cents: 5000,
        }),
      ]
      const mockExecute = vi.fn().mockResolvedValue({ invoice, transactions })
      vi.mocked(GetOrCreateInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetOrCreateInvoiceUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/2026-01`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<{
        invoice: Invoice
        transactions: Expense[]
      }>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.invoice.reference_month).toBe('2026-01')
      expect(body.data.transactions).toHaveLength(1)
    })

    it('returns 404 when credit card not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(GetOrCreateInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetOrCreateInvoiceUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/2026-01`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })

    it('returns 400 when credit card has no closing day', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            'Credit card has no closing day configured',
            HTTP_STATUS.BAD_REQUEST
          )
        )
      vi.mocked(GetOrCreateInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as GetOrCreateInvoiceUseCase
      )

      const res = await app.request(`/invoices/${CARD_ID}/2026-01`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    })
  })

  describe('POST /invoices/:invoiceId/pay', () => {
    it('pays invoice with valid amount', async () => {
      const paidInvoice = createMockInvoice({
        id: INVOICE_ID,
        user_id: USER_ID,
        paid_amount_cents: 150000,
        status: 'paid',
        paid_at: '2026-01-20T12:00:00.000Z',
      })
      const mockExecute = vi.fn().mockResolvedValue(paidInvoice)
      vi.mocked(PayInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as PayInvoiceUseCase
      )

      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 150000 }),
        },
        testEnv
      )
      const body = (await res.json()) as SuccessResponse<Invoice>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.status).toBe('paid')
      expect(body.data.paid_amount_cents).toBe(150000)
    })

    it('returns 400 for invalid amount (zero)', async () => {
      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 0 }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for negative amount', async () => {
      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: -100 }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for missing amount', async () => {
      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 404 when invoice not found', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Invoice not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(PayInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as PayInvoiceUseCase
      )

      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 150000 }),
        },
        testEnv
      )
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })

    it('returns 400 when payment exceeds remaining balance', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            'Payment amount exceeds remaining balance',
            HTTP_STATUS.BAD_REQUEST
          )
        )
      vi.mocked(PayInvoiceUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as PayInvoiceUseCase
      )

      const res = await app.request(
        `/invoices/${INVOICE_ID}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount_cents: 999999 }),
        },
        testEnv
      )
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    })
  })

  describe('Pro feature gating', () => {
    it('returns 403 when user is on free plan', async () => {
      const { checkProFeature } = await import('../../lib/check-pro-feature')
      vi.mocked(checkProFeature).mockRejectedValueOnce(
        new AppError(ERROR_CODES.LIMIT_EXCEEDED, 'Pro feature required', HTTP_STATUS.FORBIDDEN)
      )

      const res = await app.request(`/invoices/${CARD_ID}/2026-01`, { method: 'GET' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      expect(body.error.code).toBe(ERROR_CODES.LIMIT_EXCEEDED)
    })
  })
})
