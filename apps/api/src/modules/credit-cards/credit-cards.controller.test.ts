import { type ApiError, type CreditCard, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, errorHandler } from '../../middleware/error-handler.middleware'
import type { Env } from '../../types'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import { creditCardsController } from './credit-cards.controller'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

vi.mock('./list-credit-cards.usecase')
vi.mock('./create-credit-card.usecase')
vi.mock('./update-credit-card.usecase')
vi.mock('./delete-credit-card.usecase')

type SuccessResponse<T> = { data: T }
type ErrorResponse = { error: ApiError }

const USER_ID = '33333333-3333-4333-8333-333333333333'
const CARD_ID = '44444444-4444-4444-8444-444444444444'

const baseCreditCard: CreditCard = {
  id: CARD_ID,
  user_id: USER_ID,
  name: 'Nubank Ultravioleta',
  color: 'black',
  flag: 'mastercard',
  bank: 'nubank',
  last_4_digits: '1234',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const testEnv = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
}

function createTestApp() {
  const app = new Hono<Env>()
  app.onError(errorHandler)
  app.use('*', async (c, next) => {
    c.set('userId', USER_ID)
    c.set('accessToken', 'test-token')
    await next()
  })
  app.route('/credit-cards', creditCardsController)
  return app
}

describe('Credit Cards Controller', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /credit-cards', () => {
    it('returns list of credit cards', async () => {
      const mockExecute = vi.fn().mockResolvedValue([baseCreditCard])
      vi.mocked(ListCreditCardsUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListCreditCardsUseCase
      )

      const res = await app.request('/credit-cards', { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<CreditCard[]>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toHaveLength(1)
      expect(body.data[0]!.name).toBe('Nubank Ultravioleta')
    })

    it('returns empty array when no cards', async () => {
      const mockExecute = vi.fn().mockResolvedValue([])
      vi.mocked(ListCreditCardsUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as ListCreditCardsUseCase
      )

      const res = await app.request('/credit-cards', { method: 'GET' }, testEnv)
      const body = (await res.json()) as SuccessResponse<CreditCard[]>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data).toHaveLength(0)
    })
  })

  describe('POST /credit-cards', () => {
    it('creates credit card with valid input', async () => {
      const mockExecute = vi.fn().mockResolvedValue(baseCreditCard)
      vi.mocked(CreateCreditCardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as CreateCreditCardUseCase
      )

      const res = await app.request(
        '/credit-cards',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Nubank Ultravioleta',
            color: 'black',
            flag: 'mastercard',
            bank: 'nubank',
          }),
        },
        testEnv
      )
      const body = (await res.json()) as SuccessResponse<CreditCard>

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      expect(body.data.name).toBe('Nubank Ultravioleta')
    })

    it('returns validation error for invalid input', async () => {
      const res = await app.request(
        '/credit-cards',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '' }),
        },
        testEnv
      )

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('PATCH /credit-cards/:id', () => {
    it('updates credit card', async () => {
      const updatedCard = { ...baseCreditCard, name: 'Updated Name' }
      const mockExecute = vi.fn().mockResolvedValue(updatedCard)
      vi.mocked(UpdateCreditCardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateCreditCardUseCase
      )

      const res = await app.request(
        `/credit-cards/${CARD_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Name' }),
        },
        testEnv
      )
      const body = (await res.json()) as SuccessResponse<CreditCard>

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(body.data.name).toBe('Updated Name')
    })

    it('returns NOT_FOUND for non-existent card', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(UpdateCreditCardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as UpdateCreditCardUseCase
      )

      const res = await app.request(
        `/credit-cards/${CARD_ID}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Name' }),
        },
        testEnv
      )
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })
  })

  describe('DELETE /credit-cards/:id', () => {
    it('deletes credit card', async () => {
      const mockExecute = vi.fn().mockResolvedValue(undefined)
      vi.mocked(DeleteCreditCardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCreditCardUseCase
      )

      const res = await app.request(`/credit-cards/${CARD_ID}`, { method: 'DELETE' }, testEnv)

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
    })

    it('returns NOT_FOUND for non-existent card', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(
          new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
        )
      vi.mocked(DeleteCreditCardUseCase).mockImplementation(
        () => ({ execute: mockExecute }) as unknown as DeleteCreditCardUseCase
      )

      const res = await app.request(`/credit-cards/${CARD_ID}`, { method: 'DELETE' }, testEnv)
      const body = (await res.json()) as ErrorResponse

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
      expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND)
    })
  })
})
