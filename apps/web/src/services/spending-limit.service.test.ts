import type { EffectiveSpendingLimit, SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spendingLimitService } from './spending-limit.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

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

function createMockEffectiveLimit(
  overrides: Partial<EffectiveSpendingLimit> = {}
): EffectiveSpendingLimit {
  return {
    year_month: '2026-01',
    amount_cents: 500000,
    is_carried_over: false,
    source_month: null,
    ...overrides,
  }
}

describe('spendingLimitService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSpendingLimit', () => {
    it('calls correct endpoint with year-month', async () => {
      const mockLimit = createMockEffectiveLimit()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockLimit))

      const result = await spendingLimitService.getSpendingLimit('2026-01')

      expect(api.get).toHaveBeenCalledWith('/spending-limits/2026-01')
      expect(result).toEqual({ data: mockLimit })
    })

    it('returns null when no spending limit exists', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(null))

      const result = await spendingLimitService.getSpendingLimit('2026-01')

      expect(result).toEqual({ data: null })
    })

    it('returns carried over limit from previous month', async () => {
      const carriedOverLimit = createMockEffectiveLimit({
        year_month: '2026-02',
        is_carried_over: true,
        source_month: '2026-01',
      })
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(carriedOverLimit))

      const result = await spendingLimitService.getSpendingLimit('2026-02')

      expect(result).toEqual({ data: carriedOverLimit })
      expect(carriedOverLimit.is_carried_over).toBe(true)
      expect(carriedOverLimit.source_month).toBe('2026-01')
    })

    it('handles different year-month formats', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(createMockEffectiveLimit()))

      await spendingLimitService.getSpendingLimit('2025-12')

      expect(api.get).toHaveBeenCalledWith('/spending-limits/2025-12')
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await spendingLimitService.getSpendingLimit('2026-01')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('upsertSpendingLimit', () => {
    it('creates new spending limit', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 600000,
      }
      const createdLimit = createMockSpendingLimit({
        year_month: '2026-01',
        amount_cents: 600000,
      })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdLimit))

      const result = await spendingLimitService.upsertSpendingLimit(input)

      expect(api.post).toHaveBeenCalledWith('/spending-limits', input)
      expect(result).toEqual({ data: createdLimit })
    })

    it('updates existing spending limit', async () => {
      const input: UpsertSpendingLimit = {
        year_month: '2026-01',
        amount_cents: 750000,
      }
      const updatedLimit = createMockSpendingLimit({
        year_month: '2026-01',
        amount_cents: 750000,
        updated_at: '2026-01-15T10:00:00Z',
      })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(updatedLimit))

      const result = await spendingLimitService.upsertSpendingLimit(input)

      expect(result).toEqual({ data: updatedLimit })
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Amount must be positive')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await spendingLimitService.upsertSpendingLimit({
        year_month: '2026-01',
        amount_cents: -100,
      })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response for invalid year-month format', async () => {
      const errorResponse = createErrorResponse(
        'VALIDATION_ERROR',
        'Month must be in YYYY-MM format'
      )
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await spendingLimitService.upsertSpendingLimit({
        year_month: '2026-1',
        amount_cents: 500000,
      })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await spendingLimitService.upsertSpendingLimit({
        year_month: '2026-01',
        amount_cents: 500000,
      })

      expect(result).toEqual(errorResponse)
    })
  })
})
