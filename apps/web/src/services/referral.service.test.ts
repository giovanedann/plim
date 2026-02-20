import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import type {
  ClaimReferralResponse,
  ReferralStats,
  ValidateReferralCodeResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { referralService } from './referral.service'

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { api } from '@/lib/api-client'

function createMockValidateResponse(
  overrides: Partial<ValidateReferralCodeResponse> = {}
): ValidateReferralCodeResponse {
  return {
    valid: true,
    referrer_name: 'John Doe',
    ...overrides,
  }
}

function createMockReferralStats(overrides: Partial<ReferralStats> = {}): ReferralStats {
  return {
    referral_code: 'john-doe',
    referral_url: 'https://plim.app/r/john-doe',
    total_referrals: 3,
    total_pro_days_earned: 21,
    referrals: [
      { referred_name: 'Alice', created_at: '2026-01-15T00:00:00Z' },
      { referred_name: 'Bob', created_at: '2026-01-20T00:00:00Z' },
      { referred_name: null, created_at: '2026-02-01T00:00:00Z' },
    ],
    ...overrides,
  }
}

function createMockClaimResponse(
  overrides: Partial<ClaimReferralResponse> = {}
): ClaimReferralResponse {
  return {
    pro_days_granted: 7,
    ...overrides,
  }
}

describe('referralService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateCode', () => {
    it('calls correct endpoint without auth header', async () => {
      const mockData = createMockValidateResponse()
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })

      await referralService.validateCode('john-doe')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/referral/validate/john-doe'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      expect(mockFetch.mock.calls[0]?.[1]?.headers).not.toHaveProperty('Authorization')
    })

    it('returns validation response for valid code', async () => {
      const mockData = createMockValidateResponse()
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })

      const result = await referralService.validateCode('john-doe')

      expect(result).toEqual({ data: mockData })
    })

    it('returns response with null referrer_name for invalid code', async () => {
      const mockData = createMockValidateResponse({ valid: false, referrer_name: null })
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })

      const result = await referralService.validateCode('nonexistent')

      expect(result).toEqual({ data: mockData })
    })

    it('encodes special characters in code', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: createMockValidateResponse() }),
      })

      await referralService.validateCode('code with spaces')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/referral/validate/code%20with%20spaces'),
        expect.any(Object)
      )
    })

    it('returns error response when request fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: { code: 'INTERNAL_ERROR', message: 'Server error' },
          }),
      })

      const result = await referralService.validateCode('john-doe')

      expect(result).toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'Server error' },
      })
    })

    it('returns generic error when response has no error body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No body')),
      })

      const result = await referralService.validateCode('john-doe')

      expect(result).toEqual({
        error: { code: 'REQUEST_FAILED', message: 'Request failed with status 500' },
      })
    })

    it('does not use api client', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: createMockValidateResponse() }),
      })

      await referralService.validateCode('john-doe')

      expect(api.get).not.toHaveBeenCalled()
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('getReferralStats', () => {
    it('calls correct endpoint with auth', async () => {
      const mockStats = createMockReferralStats()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockStats))

      const result = await referralService.getReferralStats()

      expect(api.get).toHaveBeenCalledWith('/referral/stats')
      expect(result).toEqual({ data: mockStats })
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await referralService.getReferralStats()

      expect(result).toEqual(errorResponse)
    })

    it('returns stats with empty referrals list', async () => {
      const mockStats = createMockReferralStats({
        total_referrals: 0,
        total_pro_days_earned: 0,
        referrals: [],
      })
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockStats))

      const result = await referralService.getReferralStats()

      expect(result).toEqual({ data: mockStats })
    })
  })

  describe('claimReferral', () => {
    it('sends POST with referral code', async () => {
      const mockClaim = createMockClaimResponse()
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(mockClaim))

      const result = await referralService.claimReferral('john-doe')

      expect(api.post).toHaveBeenCalledWith('/referral/claim', { referral_code: 'john-doe' })
      expect(result).toEqual({ data: mockClaim })
    })

    it('returns error response when claim fails', async () => {
      const errorResponse = createErrorResponse('ALREADY_CLAIMED', 'Referral already claimed')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await referralService.claimReferral('john-doe')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await referralService.claimReferral('john-doe')

      expect(result).toEqual(errorResponse)
    })
  })
})
