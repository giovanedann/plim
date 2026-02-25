import { ERROR_CODES, HTTP_STATUS, type PlanTier } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../middleware/error-handler.middleware'
import { checkProFeature } from './check-pro-feature'

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

describe('checkProFeature', () => {
  const sut = checkProFeature
  let userId: string

  beforeEach(() => {
    userId = 'user-123'
  })

  it('allows pro users to access pro features', async () => {
    // Arrange
    const supabase = createMockSupabaseForTier('pro')

    // Act & Assert
    await expect(sut(supabase, userId, 'invoices')).resolves.not.toThrow()
  })

  it('allows unlimited users to access pro features', async () => {
    // Arrange
    const supabase = createMockSupabaseForTier('unlimited')

    // Act & Assert
    await expect(sut(supabase, userId, 'invoices')).resolves.not.toThrow()
  })

  it('blocks free users from pro features', async () => {
    // Arrange
    const supabase = createMockSupabaseForTier('free')

    // Act & Assert - Step 1: Verify error is thrown
    await expect(sut(supabase, userId, 'invoices')).rejects.toThrow(AppError)

    // Act & Assert - Step 2: Verify error details
    await expect(sut(supabase, userId, 'invoices')).rejects.toMatchObject({
      code: ERROR_CODES.LIMIT_EXCEEDED,
      message: 'Pro feature required',
      status: HTTP_STATUS.FORBIDDEN,
      details: {
        feature: 'invoices',
        limit: 0,
        current: 0,
      },
    })
  })

  it('defaults to free tier when no subscription found', async () => {
    // Arrange
    const supabase = createMockSupabaseForTier(null)

    // Act & Assert - Step 1: Verify error is thrown
    await expect(sut(supabase, userId, 'invoices')).rejects.toThrow(AppError)

    // Act & Assert - Step 2: Verify error details match free tier behavior
    await expect(sut(supabase, userId, 'invoices')).rejects.toMatchObject({
      code: ERROR_CODES.LIMIT_EXCEEDED,
      message: 'Pro feature required',
      status: HTTP_STATUS.FORBIDDEN,
      details: {
        feature: 'invoices',
        limit: 0,
        current: 0,
      },
    })
  })

  it('checks the invoices feature correctly', async () => {
    // Arrange
    const proSupabase = createMockSupabaseForTier('pro')
    const freeSupabase = createMockSupabaseForTier('free')

    // Act & Assert - pro tier has access
    await expect(sut(proSupabase, userId, 'invoices')).resolves.not.toThrow()

    // Act & Assert - free tier is blocked
    await expect(sut(freeSupabase, userId, 'invoices')).rejects.toMatchObject({
      code: ERROR_CODES.LIMIT_EXCEEDED,
      details: { feature: 'invoices' },
    })
  })
})
