import {
  type ClaimReferralResponse,
  ERROR_CODES,
  HTTP_STATUS,
  type ReferralStats,
  type ValidateReferralCodeResponse,
} from '@plim/shared'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { Env } from '../../types'
import type { ReferralDependencies } from './referral.factory'
import { createReferralPublicRouterWithDeps, createReferralRouterWithDeps } from './referral.routes'

const mockValidateReferralCode = { execute: vi.fn() }
const mockGetReferralStats = { execute: vi.fn() }
const mockClaimReferral = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  validateReferralCode: mockValidateReferralCode,
  getReferralStats: mockGetReferralStats,
  claimReferral: mockClaimReferral,
} as unknown as ReferralDependencies

describe('Referral Integration - Public Routes', () => {
  let publicApp: Hono<Env>

  beforeEach(() => {
    vi.clearAllMocks()

    publicApp = new Hono<Env>()
    publicApp.onError(errorHandler)
    const publicRouter = createReferralPublicRouterWithDeps(mockDependencies)
    publicApp.route('/referral', publicRouter)
  })

  describe('GET /referral/validate/:code', () => {
    it('returns 200 with valid response for valid code', async () => {
      const response: ValidateReferralCodeResponse = {
        valid: true,
        referrer_name: 'Giovane',
      }
      mockValidateReferralCode.execute.mockResolvedValue(response)

      const res = await publicApp.request('/referral/validate/giovane-abc')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: ValidateReferralCodeResponse }
      expect(body.data.valid).toBe(true)
      expect(body.data.referrer_name).toBe('Giovane')
      expect(mockValidateReferralCode.execute).toHaveBeenCalledWith('giovane-abc')
    })

    it('returns 200 with valid=false for invalid code', async () => {
      const response: ValidateReferralCodeResponse = {
        valid: false,
        referrer_name: null,
      }
      mockValidateReferralCode.execute.mockResolvedValue(response)

      const res = await publicApp.request('/referral/validate/nonexistent')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: ValidateReferralCodeResponse }
      expect(body.data.valid).toBe(false)
      expect(body.data.referrer_name).toBeNull()
    })

    it('works without authentication (public)', async () => {
      const response: ValidateReferralCodeResponse = {
        valid: true,
        referrer_name: 'Test',
      }
      mockValidateReferralCode.execute.mockResolvedValue(response)

      const res = await publicApp.request('/referral/validate/test-code')

      expect(res.status).toBe(HTTP_STATUS.OK)
    })
  })
})

describe('Referral Integration - Authenticated Routes', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createReferralRouterWithDeps(mockDependencies)
    app.route('/referral', router)
  })

  describe('GET /referral/stats', () => {
    it('returns 200 with stats for authenticated user', async () => {
      const stats: ReferralStats = {
        referral_code: 'giovane-abc',
        referral_url: 'https://plim.pro/r/giovane-abc',
        total_referrals: 3,
        total_pro_days_earned: 21,
        referrals: [
          { referred_name: 'Alice', created_at: '2026-02-01T00:00:00.000Z' },
          { referred_name: 'Bob', created_at: '2026-02-05T00:00:00.000Z' },
          { referred_name: null, created_at: '2026-02-10T00:00:00.000Z' },
        ],
      }
      mockGetReferralStats.execute.mockResolvedValue(stats)

      const res = await app.request('/referral/stats')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: ReferralStats }
      expect(body.data.referral_code).toBe('giovane-abc')
      expect(body.data.total_referrals).toBe(3)
      expect(body.data.total_pro_days_earned).toBe(21)
      expect(body.data.referrals).toHaveLength(3)
      expect(mockGetReferralStats.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns 401 without authentication', async () => {
      const unauthApp = new Hono<Env>()
      unauthApp.onError(errorHandler)

      const { authMiddleware } = await import('../../middleware/auth.middleware')
      unauthApp.use('*', authMiddleware)

      const router = createReferralRouterWithDeps(mockDependencies)
      unauthApp.route('/referral', router)

      const res = await unauthApp.request('/referral/stats')

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
    })
  })

  describe('POST /referral/claim', () => {
    it('returns 200 and grants Pro on valid claim', async () => {
      const response: ClaimReferralResponse = { pro_days_granted: 7 }
      mockClaimReferral.execute.mockResolvedValue(response)

      const res = await app.request('/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: 'giovane-abc' }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: ClaimReferralResponse }
      expect(body.data.pro_days_granted).toBe(7)
      expect(mockClaimReferral.execute).toHaveBeenCalledWith(TEST_USER_ID, {
        referral_code: 'giovane-abc',
      })
    })

    it('returns 400 for missing referral_code', async () => {
      const res = await app.request('/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.INVALID_INPUT)
    })

    it('returns 400 for invalid code from use case', async () => {
      const { AppError } = await import('../../middleware/error-handler.middleware')
      mockClaimReferral.execute.mockRejectedValue(
        new AppError(ERROR_CODES.VALIDATION_ERROR, 'invalid_code', HTTP_STATUS.BAD_REQUEST)
      )

      const res = await app.request('/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: 'invalid-code' }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    })

    it('returns 401 without authentication', async () => {
      const unauthApp = new Hono<Env>()
      unauthApp.onError(errorHandler)

      const { authMiddleware } = await import('../../middleware/auth.middleware')
      unauthApp.use('*', authMiddleware)

      const router = createReferralRouterWithDeps(mockDependencies)
      unauthApp.route('/referral', router)

      const res = await unauthApp.request('/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_code: 'giovane-abc' }),
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe(ERROR_CODES.UNAUTHORIZED)
    })
  })
})
