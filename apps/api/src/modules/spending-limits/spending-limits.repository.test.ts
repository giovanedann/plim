import type { SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpendingLimitsRepository } from './spending-limits.repository'

function createMockSpendingLimit(overrides: Partial<SpendingLimit> = {}): SpendingLimit {
  return {
    id: 'limit-123',
    user_id: 'user-123',
    year_month: '2026-01',
    amount_cents: 500000,
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

describe('SpendingLimitsRepository', () => {
  let sut: SpendingLimitsRepository
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new SpendingLimitsRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByMonth', () => {
    it('returns spending limit for exact month', async () => {
      // Arrange
      const limit = createMockSpendingLimit()

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: limit, error: null }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findByMonth('user-123', '2026-01')

      // Assert
      expect(result).toEqual(limit)
      expect(mockSupabase.from).toHaveBeenCalledWith('spending_limit')
    })

    it('returns null when no limit exists for month', async () => {
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
      const result = await sut.findByMonth('user-123', '2025-06')

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
      const result = await sut.findByMonth('user-123', '2026-01')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('findMostRecentBefore', () => {
    it('returns most recent limit before or on given month', async () => {
      // Arrange
      const limit = createMockSpendingLimit({ year_month: '2025-12' })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: limit, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findMostRecentBefore('user-123', '2026-02')

      // Assert
      expect(result).toEqual(limit)
      expect(mockSupabase.from).toHaveBeenCalledWith('spending_limit')
    })

    it('returns limit for exact month when exists', async () => {
      // Arrange
      const limit = createMockSpendingLimit({ year_month: '2026-01' })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: limit, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findMostRecentBefore('user-123', '2026-01')

      // Assert
      expect(result).toEqual(limit)
    })

    it('returns null when no limit exists before month', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findMostRecentBefore('user-123', '2024-01')

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findMostRecentBefore('user-123', '2026-01')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('creates new spending limit', async () => {
      // Arrange
      const input: UpsertSpendingLimit = {
        year_month: '2026-02',
        amount_cents: 600000,
      }
      const createdLimit = createMockSpendingLimit({
        year_month: '2026-02',
        amount_cents: 600000,
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdLimit, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.upsert('user-123', input)

      // Assert
      expect(result).toEqual(createdLimit)
      expect(mockSupabase.from).toHaveBeenCalledWith('spending_limit')
    })

    it('updates existing spending limit', async () => {
      // Arrange
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 750000,
      }
      const updatedLimit = createMockSpendingLimit({
        year_month: '2026-01',
        amount_cents: 750000,
        updated_at: '2026-01-15T10:00:00Z',
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedLimit, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.upsert('user-123', input)

      // Assert
      expect(result).toEqual(updatedLimit)
    })

    it('returns null on upsert error', async () => {
      // Arrange
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 500000,
      }

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Upsert failed') }),
          }),
        }),
      })

      // Act
      const result = await sut.upsert('user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when upsert returns null data', async () => {
      // Arrange
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 500000,
      }

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.upsert('user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('calls upsert with correct onConflict option', async () => {
      // Arrange
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 500000,
      }
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createMockSpendingLimit(), error: null }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert,
      })

      // Act
      await sut.upsert('user-123', input)

      // Assert
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: 'user-123',
          year_month: '2026-01',
          amount_cents: 500000,
        },
        { onConflict: 'user_id,year_month' }
      )
    })
  })
})
