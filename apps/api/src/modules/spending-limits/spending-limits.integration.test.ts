import {
  type EffectiveSpendingLimit,
  HTTP_STATUS,
  type SpendingLimit,
  createMockSpendingLimit,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { SpendingLimitsDependencies } from './spending-limits.factory'
import { createSpendingLimitsRouterWithDeps } from './spending-limits.routes'

// Mock use cases
const mockGetSpendingLimit = { execute: vi.fn() }
const mockUpsertSpendingLimit = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  getSpendingLimit: mockGetSpendingLimit,
  upsertSpendingLimit: mockUpsertSpendingLimit,
} as unknown as SpendingLimitsDependencies

describe('Spending Limits Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createSpendingLimitsRouterWithDeps(mockDependencies)
    app.route('/spending-limits', router)
  })

  describe('GET /spending-limits/:yearMonth', () => {
    it('returns spending limit for given month', async () => {
      const effectiveLimit: EffectiveSpendingLimit = {
        year_month: '2024-01',
        amount_cents: 300000,
        is_carried_over: false,
        source_month: null,
      }
      mockGetSpendingLimit.execute.mockResolvedValue(effectiveLimit)

      const res = await app.request('/spending-limits/2024-01')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: EffectiveSpendingLimit }
      expect(body.data).toEqual(effectiveLimit)
      expect(mockGetSpendingLimit.execute).toHaveBeenCalledWith(TEST_USER_ID, '2024-01')
    })

    it('returns null when no limit exists', async () => {
      mockGetSpendingLimit.execute.mockResolvedValue(null)

      const res = await app.request('/spending-limits/2024-01')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: EffectiveSpendingLimit | null }
      expect(body.data).toBeNull()
    })

    it('returns effective limit from previous month when carried over', async () => {
      const carriedLimit: EffectiveSpendingLimit = {
        year_month: '2024-01',
        amount_cents: 300000,
        is_carried_over: true,
        source_month: '2023-12',
      }
      mockGetSpendingLimit.execute.mockResolvedValue(carriedLimit)

      const res = await app.request('/spending-limits/2024-01')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: EffectiveSpendingLimit }
      expect(body.data.is_carried_over).toBe(true)
      expect(body.data.source_month).toBe('2023-12')
    })
  })

  describe('POST /spending-limits', () => {
    it('creates spending limit with valid input', async () => {
      const limit = createMockSpendingLimit({ year_month: '2024-01', amount_cents: 300000 })
      mockUpsertSpendingLimit.execute.mockResolvedValue(limit)

      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024-01',
          amount_cents: 300000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: SpendingLimit }
      expect(body.data).toEqual(limit)
      expect(mockUpsertSpendingLimit.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          year_month: '2024-01',
          amount_cents: 300000,
        })
      )
    })

    it('updates existing spending limit', async () => {
      const updatedLimit = createMockSpendingLimit({ year_month: '2024-01', amount_cents: 350000 })
      mockUpsertSpendingLimit.execute.mockResolvedValue(updatedLimit)

      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024-01',
          amount_cents: 350000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: SpendingLimit }
      expect(body.data.amount_cents).toBe(350000)
    })

    it('validates required fields', async () => {
      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024-01',
          // Missing amount_cents
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates year_month format', async () => {
      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024/01', // Invalid format
          amount_cents: 300000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates positive limit amount', async () => {
      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024-01',
          amount_cents: -100, // Negative amount
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates zero is not allowed', async () => {
      const res = await app.request('/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_month: '2024-01',
          amount_cents: 0, // Zero not allowed (must be positive)
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })
  })
})
