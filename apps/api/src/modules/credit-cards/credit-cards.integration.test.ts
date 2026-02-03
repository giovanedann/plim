import {
  type CreditCard,
  ERROR_CODES,
  HTTP_STATUS,
  createMockCreditCard,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { CreditCardsDependencies } from './credit-cards.factory'
import { createCreditCardsRouterWithDeps } from './credit-cards.routes'

// Mock use cases
const mockListCreditCards = { execute: vi.fn() }
const mockCreateCreditCard = { execute: vi.fn() }
const mockUpdateCreditCard = { execute: vi.fn() }
const mockDeleteCreditCard = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  listCreditCards: mockListCreditCards,
  createCreditCard: mockCreateCreditCard,
  updateCreditCard: mockUpdateCreditCard,
  deleteCreditCard: mockDeleteCreditCard,
} as unknown as CreditCardsDependencies

describe('Credit Cards Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createCreditCardsRouterWithDeps(mockDependencies)
    app.route('/credit-cards', router)
  })

  describe('POST /credit-cards - Create card', () => {
    it('creates credit card with valid input', async () => {
      const creditCard = createMockCreditCard({
        name: 'Visa Platinum',
        last_4_digits: '1234',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
      })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Visa Platinum',
          last_4_digits: '1234',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)

      const body = (await res.json()) as { data: CreditCard }
      expect(body.data).toEqual(creditCard)
      expect(mockCreateCreditCard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          name: 'Visa Platinum',
          last_4_digits: '1234',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
        })
      )
    })

    it('creates card with optional last_4_digits', async () => {
      const creditCard = createMockCreditCard({
        name: 'Mastercard Gold',
        color: 'gold',
        flag: 'mastercard',
        bank: 'inter',
        last_4_digits: null,
      })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mastercard Gold',
          color: 'gold',
          flag: 'mastercard',
          bank: 'inter',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: CreditCard }
      expect(body.data.color).toBe('gold')
      expect(body.data.flag).toBe('mastercard')
      expect(body.data.bank).toBe('inter')
    })

    it('returns 400 for missing required fields', async () => {
      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Card without required fields',
          // Missing color, flag, bank
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid color value', async () => {
      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Card',
          color: 'invalid_color',
          flag: 'visa',
          bank: 'nubank',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid last_4_digits format', async () => {
      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Card',
          last_4_digits: '12', // Too short
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })

  describe('GET /credit-cards - List cards', () => {
    it('returns all credit cards for user', async () => {
      const cards = [
        createMockCreditCard({ name: 'Visa Platinum' }),
        createMockCreditCard({ name: 'Mastercard Gold' }),
        createMockCreditCard({ name: 'Amex Blue' }),
      ]

      mockListCreditCards.execute.mockResolvedValue(cards)

      const res = await app.request('/credit-cards', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: CreditCard[] }
      expect(body.data).toHaveLength(3)
      expect(mockListCreditCards.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns empty array when no cards exist', async () => {
      mockListCreditCards.execute.mockResolvedValue([])

      const res = await app.request('/credit-cards', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: CreditCard[] }
      expect(body.data).toEqual([])
    })

    it('enforces user isolation', async () => {
      const cards = [createMockCreditCard({ user_id: TEST_USER_ID })]

      mockListCreditCards.execute.mockResolvedValue(cards)

      await app.request('/credit-cards', {
        method: 'GET',
      })

      expect(mockListCreditCards.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })
  })

  describe('PATCH /credit-cards/:id - Update card', () => {
    it('updates card with valid data', async () => {
      const updatedCard = createMockCreditCard({
        id: 'card-123',
        name: 'Updated Card Name',
      })

      mockUpdateCreditCard.execute.mockResolvedValue(updatedCard)

      const res = await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Card Name',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)

      const body = (await res.json()) as { data: CreditCard }
      expect(body.data.name).toBe('Updated Card Name')
      expect(mockUpdateCreditCard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'card-123',
        expect.objectContaining({
          name: 'Updated Card Name',
        })
      )
    })

    it('updates only specified fields', async () => {
      const updatedCard = createMockCreditCard({
        id: 'card-123',
        color: 'neon_green',
      })

      mockUpdateCreditCard.execute.mockResolvedValue(updatedCard)

      const res = await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: 'neon_green',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: CreditCard }
      expect(body.data.color).toBe('neon_green')
    })

    it('updates flag and bank', async () => {
      const updatedCard = createMockCreditCard({
        id: 'card-123',
        flag: 'mastercard',
        bank: 'itau',
      })

      mockUpdateCreditCard.execute.mockResolvedValue(updatedCard)

      const res = await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flag: 'mastercard',
          bank: 'itau',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: CreditCard }
      expect(body.data.flag).toBe('mastercard')
      expect(body.data.bank).toBe('itau')
    })

    it('returns 404 when updating nonexistent card', async () => {
      mockUpdateCreditCard.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/credit-cards/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('returns 400 for invalid update data', async () => {
      const res = await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: 'invalid_color',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('enforces user ownership on update', async () => {
      const updatedCard = createMockCreditCard({ id: 'card-123' })

      mockUpdateCreditCard.execute.mockResolvedValue(updatedCard)

      await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })

      expect(mockUpdateCreditCard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'card-123',
        expect.any(Object)
      )
    })
  })

  describe('DELETE /credit-cards/:id - Soft delete card', () => {
    it('deletes card successfully', async () => {
      mockDeleteCreditCard.execute.mockResolvedValue(undefined)

      const res = await app.request('/credit-cards/card-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteCreditCard.execute).toHaveBeenCalledWith(TEST_USER_ID, 'card-123')
    })

    it('returns 404 when deleting nonexistent card', async () => {
      mockDeleteCreditCard.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Credit card not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/credit-cards/nonexistent', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('enforces user ownership on delete', async () => {
      mockDeleteCreditCard.execute.mockResolvedValue(undefined)

      await app.request('/credit-cards/card-123', {
        method: 'DELETE',
      })

      expect(mockDeleteCreditCard.execute).toHaveBeenCalledWith(TEST_USER_ID, 'card-123')
    })

    it('performs soft delete', async () => {
      mockDeleteCreditCard.execute.mockResolvedValue(undefined)

      const res = await app.request('/credit-cards/card-123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      // Soft delete means the card is not physically removed, just marked as deleted
      expect(mockDeleteCreditCard.execute).toHaveBeenCalledWith(TEST_USER_ID, 'card-123')
    })
  })

  describe('User isolation across operations', () => {
    it('ensures cards are scoped to authenticated user', async () => {
      const cards = [createMockCreditCard({ user_id: TEST_USER_ID })]
      mockListCreditCards.execute.mockResolvedValue(cards)

      // List
      await app.request('/credit-cards', { method: 'GET' })
      expect(mockListCreditCards.execute).toHaveBeenCalledWith(TEST_USER_ID)

      // Create
      const newCard = createMockCreditCard()
      mockCreateCreditCard.execute.mockResolvedValue(newCard)
      await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Card',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
          last_4_digits: '1234',
        }),
      })
      expect(mockCreateCreditCard.execute).toHaveBeenCalledWith(TEST_USER_ID, expect.any(Object))

      // Update
      const updatedCard = createMockCreditCard()
      mockUpdateCreditCard.execute.mockResolvedValue(updatedCard)
      await app.request('/credit-cards/card-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(mockUpdateCreditCard.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        'card-123',
        expect.any(Object)
      )

      // Delete
      mockDeleteCreditCard.execute.mockResolvedValue(undefined)
      await app.request('/credit-cards/card-123', { method: 'DELETE' })
      expect(mockDeleteCreditCard.execute).toHaveBeenCalledWith(TEST_USER_ID, 'card-123')
    })
  })

  describe('Boundary cases', () => {
    it('handles card with all valid enum values', async () => {
      const creditCard = createMockCreditCard({
        name: 'Test Card',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
        last_4_digits: '0000',
      })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Card',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
          last_4_digits: '0000',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })

    it('handles card with different enum values', async () => {
      const creditCard = createMockCreditCard({
        color: 'rose_gold',
        flag: 'american_express',
        bank: 'bradesco',
        last_4_digits: '9999',
      })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Amex Card',
          color: 'rose_gold',
          flag: 'american_express',
          bank: 'bradesco',
          last_4_digits: '9999',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })

    it('handles card without optional last_4_digits', async () => {
      const creditCard = createMockCreditCard({
        name: 'Basic Card',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
        last_4_digits: null,
      })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Basic Card',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })

    it('handles last_4_digits with exactly 4 digits', async () => {
      const creditCard = createMockCreditCard({ last_4_digits: '0000' })

      mockCreateCreditCard.execute.mockResolvedValue(creditCard)

      const res = await app.request('/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Card',
          color: 'black',
          flag: 'visa',
          bank: 'nubank',
          last_4_digits: '0000',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })
  })
})
