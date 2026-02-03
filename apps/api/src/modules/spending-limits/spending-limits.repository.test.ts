import type { UpsertSpendingLimit } from '@plim/shared'
import { createMockSpendingLimit } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpendingLimitsRepository } from './spending-limits.repository'

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
  }
}

describe('SpendingLimitsRepository', () => {
  let sut: SpendingLimitsRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new SpendingLimitsRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByMonth', () => {
    it('returns spending limit for exact month', async () => {
      const limit = createMockSpendingLimit({ year_month: '2026-01' })
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: limit, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findByMonth('user-123', '2026-01')

      expect(result).toEqual(limit)
    })

    it('returns null when no limit exists for month', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      const result = await sut.findByMonth('user-123', '2025-06')

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

      const result = await sut.findByMonth('user-123', '2026-01')

      expect(result).toBeNull()
    })
  })

  describe('findMostRecentBefore', () => {
    it('returns most recent limit before or on given month', async () => {
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

      const result = await sut.findMostRecentBefore('user-123', '2026-02')

      expect(result).toEqual(limit)
    })

    it('returns limit for exact month when exists', async () => {
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

      const result = await sut.findMostRecentBefore('user-123', '2026-01')

      expect(result).toEqual(limit)
    })

    it('returns null when no limit exists before month', async () => {
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

      const result = await sut.findMostRecentBefore('user-123', '2024-01')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
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

      const result = await sut.findMostRecentBefore('user-123', '2026-01')

      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('creates new spending limit', async () => {
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

      const result = await sut.upsert('user-123', input)

      expect(result).toEqual(createdLimit)
    })

    it('updates existing spending limit', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 750000,
      }
      const updatedLimit = createMockSpendingLimit({
        year_month: '2026-01',
        amount_cents: 750000,
      })
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedLimit, error: null }),
          }),
        }),
      })

      const result = await sut.upsert('user-123', input)

      expect(result).toEqual(updatedLimit)
    })

    it('returns null on upsert error', async () => {
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

      const result = await sut.upsert('user-123', input)

      expect(result).toBeNull()
    })

    it('returns null when upsert returns null data', async () => {
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

      const result = await sut.upsert('user-123', input)

      expect(result).toBeNull()
    })
  })
})
