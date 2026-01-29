import {
  type CreateCreditCard,
  type UpdateCreditCard,
  createErrorResponse,
  createMockCreditCard,
  createSuccessResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { creditCardService } from './credit-card.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

describe('creditCardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('listCreditCards', () => {
    it('calls correct endpoint', async () => {
      const mockCards = [
        createMockCreditCard({ name: 'Nubank' }),
        createMockCreditCard({ name: 'Inter' }),
      ]
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockCards))

      const result = await creditCardService.listCreditCards()

      expect(api.get).toHaveBeenCalledWith('/credit-cards')
      expect(result).toEqual({ data: mockCards })
    })

    it('returns empty array when no credit cards exist', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse([]))

      const result = await creditCardService.listCreditCards()

      expect(result).toEqual({ data: [] })
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await creditCardService.listCreditCards()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createCreditCard', () => {
    it('sends correct payload with all fields', async () => {
      const input: CreateCreditCard = {
        name: 'Nubank Platinum',
        bank: 'nubank',
        flag: 'mastercard',
        color: 'light_purple',
        last_4_digits: '1234',
      }
      const createdCard = createMockCreditCard(input)
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdCard))

      const result = await creditCardService.createCreditCard(input)

      expect(api.post).toHaveBeenCalledWith('/credit-cards', input)
      expect(result).toEqual({ data: createdCard })
    })

    it('sends correct payload with minimal fields', async () => {
      const input: CreateCreditCard = {
        name: 'Basic Card',
        bank: 'other',
        flag: 'visa',
        color: 'black',
      }
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockCreditCard(input)))

      await creditCardService.createCreditCard(input)

      expect(api.post).toHaveBeenCalledWith('/credit-cards', input)
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Name is required')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await creditCardService.createCreditCard({
        name: '',
        bank: 'nubank',
        flag: 'visa',
        color: 'black',
      })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await creditCardService.createCreditCard({
        name: 'Test',
        bank: 'nubank',
        flag: 'visa',
        color: 'black',
      })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('updateCreditCard', () => {
    it('sends correct payload with partial update', async () => {
      const input: UpdateCreditCard = {
        name: 'Nubank Gold',
      }
      const updatedCard = createMockCreditCard({ id: 'card-123', name: 'Nubank Gold' })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedCard))

      const result = await creditCardService.updateCreditCard('card-123', input)

      expect(api.patch).toHaveBeenCalledWith('/credit-cards/card-123', input)
      expect(result).toEqual({ data: updatedCard })
    })

    it('sends correct payload with all updateable fields', async () => {
      const input: UpdateCreditCard = {
        name: 'Updated Card',
        bank: 'itau',
        flag: 'elo',
        color: 'orange',
        last_4_digits: '5678',
        is_active: false,
      }
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(createMockCreditCard(input)))

      await creditCardService.updateCreditCard('card-123', input)

      expect(api.patch).toHaveBeenCalledWith('/credit-cards/card-123', input)
    })

    it('returns error response when card not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Credit card not found')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await creditCardService.updateCreditCard('non-existent', { name: 'Test' })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Invalid bank')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await creditCardService.updateCreditCard('card-123', {
        bank: 'invalid-bank' as 'nubank',
      })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteCreditCard', () => {
    it('calls correct endpoint with card id', async () => {
      vi.mocked(api.delete).mockResolvedValue(
        createSuccessResponse(undefined as unknown as undefined)
      )

      const result = await creditCardService.deleteCreditCard('card-123')

      expect(api.delete).toHaveBeenCalledWith('/credit-cards/card-123')
      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when card not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Credit card not found')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await creditCardService.deleteCreditCard('non-existent')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when card has associated expenses', async () => {
      const errorResponse = createErrorResponse(
        'CONFLICT',
        'Cannot delete credit card with associated expenses'
      )
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await creditCardService.deleteCreditCard('card-with-expenses')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await creditCardService.deleteCreditCard('card-123')

      expect(result).toEqual(errorResponse)
    })
  })
})
