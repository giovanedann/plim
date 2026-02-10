import { ERROR_CODES, HTTP_STATUS, PLAN_LIMITS, type PlanTier } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../middleware/error-handler.middleware'
import { checkPlanLimit } from './check-plan-limit'

function createMockSupabaseForTier(tier: PlanTier | null): SupabaseClient {
  const mockSingle = vi.fn().mockResolvedValue({
    data: tier ? { tier } : null,
    error: null,
  })

  const mockEq = vi.fn().mockReturnValue({
    single: mockSingle,
  })

  const mockSelect = vi.fn().mockReturnValue({
    eq: mockEq,
  })

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
  })

  return {
    from: mockFrom,
  } as unknown as SupabaseClient
}

describe('checkPlanLimit', () => {
  let userId: string

  beforeEach(() => {
    userId = 'user-123'
  })

  describe('categories.custom feature', () => {
    it('throws LIMIT_EXCEEDED when free user at limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'categories.custom'
      const currentCount = PLAN_LIMITS.free.categories.custom // 5

      // Act & Assert - Step 1: Verify error is thrown
      await expect(checkPlanLimit({ supabase, userId, feature, currentCount })).rejects.toThrow()

      // Act & Assert - Step 2: Verify error details
      try {
        await checkPlanLimit({ supabase, userId, feature, currentCount })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        const appError = error as AppError
        expect(appError.code).toBe(ERROR_CODES.LIMIT_EXCEEDED)
        expect(appError.message).toBe('Plan limit exceeded')
        expect(appError.status).toBe(HTTP_STATUS.FORBIDDEN)
        expect(appError.details).toEqual({
          feature: 'categories.custom',
          limit: 5,
          current: 5,
        })
      }
    })

    it('does not throw when free user under limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'categories.custom'
      const currentCount = 3

      // Act & Assert
      await expect(
        checkPlanLimit({ supabase, userId, feature, currentCount })
      ).resolves.not.toThrow()
    })

    it('does not throw for pro user regardless of count', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('pro')
      const feature = 'categories.custom'
      const currentCount = 100

      // Act & Assert
      await expect(
        checkPlanLimit({ supabase, userId, feature, currentCount })
      ).resolves.not.toThrow()
    })
  })

  describe('creditCards feature', () => {
    it('throws LIMIT_EXCEEDED when free user at limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'creditCards'
      const currentCount = PLAN_LIMITS.free.creditCards // 2

      // Act & Assert - Step 1: Verify error is thrown
      await expect(checkPlanLimit({ supabase, userId, feature, currentCount })).rejects.toThrow()

      // Act & Assert - Step 2: Verify error details
      try {
        await checkPlanLimit({ supabase, userId, feature, currentCount })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        const appError = error as AppError
        expect(appError.code).toBe(ERROR_CODES.LIMIT_EXCEEDED)
        expect(appError.message).toBe('Plan limit exceeded')
        expect(appError.status).toBe(HTTP_STATUS.FORBIDDEN)
        expect(appError.details).toEqual({
          feature: 'creditCards',
          limit: 2,
          current: 2,
        })
      }
    })

    it('does not throw when free user under limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'creditCards'
      const currentCount = 1

      // Act & Assert
      await expect(
        checkPlanLimit({ supabase, userId, feature, currentCount })
      ).resolves.not.toThrow()
    })
  })

  describe('dashboard.timeRangeDays feature', () => {
    it('throws LIMIT_EXCEEDED when free user exceeds limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'dashboard.timeRangeDays'
      const currentCount = PLAN_LIMITS.free.dashboard.timeRangeDays // 30

      // Act & Assert - Step 1: Verify error is thrown
      await expect(checkPlanLimit({ supabase, userId, feature, currentCount })).rejects.toThrow()

      // Act & Assert - Step 2: Verify error details
      try {
        await checkPlanLimit({ supabase, userId, feature, currentCount })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        const appError = error as AppError
        expect(appError.code).toBe(ERROR_CODES.LIMIT_EXCEEDED)
        expect(appError.message).toBe('Plan limit exceeded')
        expect(appError.status).toBe(HTTP_STATUS.FORBIDDEN)
        expect(appError.details).toEqual({
          feature: 'dashboard.timeRangeDays',
          limit: 30,
          current: 30,
        })
      }
    })

    it('does not throw when pro user requests extended time range', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('pro')
      const feature = 'dashboard.timeRangeDays'
      const currentCount = 365

      // Act & Assert
      await expect(
        checkPlanLimit({ supabase, userId, feature, currentCount })
      ).resolves.not.toThrow()
    })
  })

  describe('missing subscription handling', () => {
    it('handles missing subscription as free tier', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier(null)
      const feature = 'categories.custom'
      const currentCount = PLAN_LIMITS.free.categories.custom // 5

      // Act & Assert - Step 1: Verify error is thrown
      await expect(checkPlanLimit({ supabase, userId, feature, currentCount })).rejects.toThrow()

      // Act & Assert - Step 2: Verify error details match free tier
      try {
        await checkPlanLimit({ supabase, userId, feature, currentCount })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        const appError = error as AppError
        expect(appError.code).toBe(ERROR_CODES.LIMIT_EXCEEDED)
        expect(appError.details).toEqual({
          feature: 'categories.custom',
          limit: 5, // Free tier limit
          current: 5,
        })
      }
    })

    it('does not throw for missing subscription when under free tier limit', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier(null)
      const feature = 'categories.custom'
      const currentCount = 3

      // Act & Assert
      await expect(
        checkPlanLimit({ supabase, userId, feature, currentCount })
      ).resolves.not.toThrow()
    })
  })

  describe('supabase query chain verification', () => {
    it('queries subscription table with correct parameters', async () => {
      // Arrange
      const supabase = createMockSupabaseForTier('free')
      const feature = 'categories.custom'
      const currentCount = 3

      // Act
      await checkPlanLimit({ supabase, userId, feature, currentCount })

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('subscription')
      expect(supabase.from('subscription').select).toHaveBeenCalledWith('tier')
      expect(supabase.from('subscription').select('tier').eq).toHaveBeenCalledWith(
        'user_id',
        userId
      )
    })
  })
})
