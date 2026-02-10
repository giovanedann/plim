import type { PlanTier } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { clampDateRange } from './clamp-date-range'

function createMockSupabaseForTier(tier: PlanTier | null) {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  mockFrom.mockReturnValue({
    select: mockSelect,
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
  })

  mockSingle.mockResolvedValue({
    data: tier ? { tier } : null,
    error: null,
  })

  const supabase = {
    from: mockFrom,
  } as unknown as SupabaseClient

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
  }
}

describe('clampDateRange', () => {
  describe('free tier clamping', () => {
    it('clamps range to 30 days for free user requesting >30 days (90 day range)', async () => {
      // Arrange
      const mocks = createMockSupabaseForTier('free')
      const userId = 'user-123'
      const startDate = '2024-01-01'
      const endDate = '2024-03-31'

      // Act
      const result = await clampDateRange({
        supabase: mocks.supabase,
        userId,
        startDate,
        endDate,
      })

      // Assert
      expect(result.start_date).toBe('2024-03-01')
      expect(result.end_date).toBe('2024-03-31')
      expect(result.tier).toBe('free')
      expect(mocks.mockFrom).toHaveBeenCalledWith('subscription')
      expect(mocks.mockSelect).toHaveBeenCalledWith('tier')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockSingle).toHaveBeenCalled()
    })

    it('does not clamp when free user requests <= 30 days (15 day range)', async () => {
      // Arrange
      const mocks = createMockSupabaseForTier('free')
      const userId = 'user-123'
      const startDate = '2024-01-01'
      const endDate = '2024-01-15'

      // Act
      const result = await clampDateRange({
        supabase: mocks.supabase,
        userId,
        startDate,
        endDate,
      })

      // Assert
      expect(result.start_date).toBe('2024-01-01')
      expect(result.end_date).toBe('2024-01-15')
    })

    it('preserves end_date when clamping (only start_date changes)', async () => {
      // Arrange
      const mocks = createMockSupabaseForTier('free')
      const userId = 'user-123'
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      // Act
      const result = await clampDateRange({
        supabase: mocks.supabase,
        userId,
        startDate,
        endDate,
      })

      // Assert
      expect(result.end_date).toBe(endDate)
      expect(result.start_date).not.toBe(startDate)
      expect(result.start_date).toBe('2024-12-01')
    })
  })

  describe('pro tier behavior', () => {
    it('preserves full range for pro user', async () => {
      // Arrange
      const mocks = createMockSupabaseForTier('pro')
      const userId = 'user-123'
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      // Act
      const result = await clampDateRange({
        supabase: mocks.supabase,
        userId,
        startDate,
        endDate,
      })

      // Assert
      expect(result.start_date).toBe('2024-01-01')
      expect(result.end_date).toBe('2024-12-31')
      expect(result.tier).toBe('pro')
    })
  })

  describe('missing subscription', () => {
    it('handles missing subscription as free tier', async () => {
      // Arrange
      const mocks = createMockSupabaseForTier(null)
      const userId = 'user-123'
      const startDate = '2024-01-01'
      const endDate = '2024-06-30'

      // Act
      const result = await clampDateRange({
        supabase: mocks.supabase,
        userId,
        startDate,
        endDate,
      })

      // Assert
      expect(result.start_date).toBe('2024-05-31')
      expect(result.end_date).toBe('2024-06-30')
      expect(result.tier).toBe('free')
    })
  })
})
