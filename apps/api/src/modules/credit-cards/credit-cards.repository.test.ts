import type { CreateCreditCard, CreditCard, UpdateCreditCard } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreditCardsRepository } from './credit-cards.repository'

function createMockCreditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: 'card-123',
    user_id: 'user-123',
    name: 'Nubank',
    color: 'dark_blue',
    flag: 'mastercard',
    bank: 'nubank',
    last_4_digits: '1234',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function createMockSupabaseClient() {
  return {
    from: vi.fn(),
  }
}

describe('CreditCardsRepository', () => {
  let sut: CreditCardsRepository
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new CreditCardsRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByUserId', () => {
    it('returns credit cards for user', async () => {
      // Arrange
      const cards = [
        createMockCreditCard({ id: 'card-1', name: 'Card A' }),
        createMockCreditCard({ id: 'card-2', name: 'Card B' }),
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: cards, error: null }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findByUserId('user-123')

      // Assert
      expect(result).toEqual(cards)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_card')
    })

    it('returns empty array on error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findByUserId('user-123')

      // Assert
      expect(result).toEqual([])
    })

    it('returns empty array when no cards exist', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findByUserId('user-123')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns credit card when found', async () => {
      // Arrange
      const card = createMockCreditCard()

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: card, error: null }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('card-123', 'user-123')

      // Assert
      expect(result).toEqual(card)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_card')
    })

    it('returns null when card not found', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('non-existent', 'user-123')

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('card-123', 'user-123')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns new credit card', async () => {
      // Arrange
      const input: CreateCreditCard = {
        name: 'New Card',
        color: 'black',
        flag: 'visa',
        bank: 'itau',
        last_4_digits: '5678',
      }
      const createdCard = createMockCreditCard({
        name: 'New Card',
        color: 'black',
        flag: 'visa',
        bank: 'itau',
        last_4_digits: '5678',
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdCard, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(createdCard)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_card')
    })

    it('creates card without last 4 digits', async () => {
      // Arrange
      const input: CreateCreditCard = {
        name: 'New Card',
        color: 'black',
        flag: 'visa',
        bank: 'itau',
      }
      const createdCard = createMockCreditCard({
        name: 'New Card',
        color: 'black',
        flag: 'visa',
        bank: 'itau',
        last_4_digits: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdCard, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(createdCard)
      expect(result?.last_4_digits).toBeNull()
    })

    it('returns null on creation error', async () => {
      // Arrange
      const input: CreateCreditCard = {
        name: 'New Card',
        color: 'black',
        flag: 'visa',
        bank: 'itau',
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates and returns credit card', async () => {
      // Arrange
      const input: UpdateCreditCard = { name: 'Updated Card', color: 'gold' }
      const updatedCard = createMockCreditCard({ name: 'Updated Card', color: 'gold' })

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedCard, error: null }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('card-123', 'user-123', input)

      // Assert
      expect(result).toEqual(updatedCard)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_card')
    })

    it('updates partial fields', async () => {
      // Arrange
      const input: UpdateCreditCard = { last_4_digits: '9999' }
      const updatedCard = createMockCreditCard({ last_4_digits: '9999' })

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedCard, error: null }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('card-123', 'user-123', input)

      // Assert
      expect(result).toEqual(updatedCard)
    })

    it('returns null when card not found', async () => {
      // Arrange
      const input: UpdateCreditCard = { name: 'Updated Card' }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('non-existent', 'user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on update error', async () => {
      // Arrange
      const input: UpdateCreditCard = { name: 'Updated Card' }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: new Error('Update failed') }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('card-123', 'user-123', input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('softDelete', () => {
    it('returns true on successful soft delete', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('card-123', 'user-123')

      // Assert
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_card')
    })

    it('returns false when card not found', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('non-existent', 'user-123')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed'), count: null }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('card-123', 'user-123')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when count is null', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: null }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('card-123', 'user-123')

      // Assert
      expect(result).toBe(false)
    })
  })
})
