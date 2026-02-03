import type { CreateCreditCard, UpdateCreditCard } from '@plim/shared'
import { createMockCreditCard } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreditCardsRepository } from './credit-cards.repository'

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
  }
}

describe('CreditCardsRepository', () => {
  let sut: CreditCardsRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new CreditCardsRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByUserId', () => {
    it('returns credit cards for user', async () => {
      const cards = [
        createMockCreditCard({ name: 'Card A' }),
        createMockCreditCard({ name: 'Card B' }),
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

      const result = await sut.findByUserId('user-123')

      expect(result).toEqual(cards)
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      const result = await sut.findByUserId('user-123')

      expect(result).toEqual([])
    })

    it('returns empty array when no cards exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findByUserId('user-123')

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns credit card when found', async () => {
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

      const result = await sut.findById('card-123', 'user-123')

      expect(result).toEqual(card)
    })

    it('returns null when card not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      const result = await sut.findById('non-existent', 'user-123')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      const result = await sut.findById('card-123', 'user-123')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns new credit card', async () => {
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

      const result = await sut.create('user-123', input)

      expect(result).toEqual(createdCard)
    })

    it('creates card without last 4 digits', async () => {
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

      const result = await sut.create('user-123', input)

      expect(result?.last_4_digits).toBeNull()
    })

    it('returns null on creation error', async () => {
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

      const result = await sut.create('user-123', input)

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates and returns credit card', async () => {
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

      const result = await sut.update('card-123', 'user-123', input)

      expect(result).toEqual(updatedCard)
    })

    it('returns null when card not found', async () => {
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

      const result = await sut.update('non-existent', 'user-123', input)

      expect(result).toBeNull()
    })

    it('returns null on update error', async () => {
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

      const result = await sut.update('card-123', 'user-123', input)

      expect(result).toBeNull()
    })
  })

  describe('softDelete', () => {
    it('returns true on successful soft delete', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
          }),
        }),
      })

      const result = await sut.softDelete('card-123', 'user-123')

      expect(result).toBe(true)
    })

    it('returns false when card not found', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
          }),
        }),
      })

      const result = await sut.softDelete('non-existent', 'user-123')

      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed'), count: null }),
          }),
        }),
      })

      const result = await sut.softDelete('card-123', 'user-123')

      expect(result).toBe(false)
    })

    it('returns false when count is null', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: null }),
          }),
        }),
      })

      const result = await sut.softDelete('card-123', 'user-123')

      expect(result).toBe(false)
    })
  })
})
