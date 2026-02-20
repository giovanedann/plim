import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferralRepository } from './referral.repository'

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

describe('ReferralRepository', () => {
  let sut: ReferralRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new ReferralRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('getProfileByReferralCode', () => {
    it('returns profile for valid code', async () => {
      const profile = { user_id: 'user-123', name: 'Test User' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profile, error: null }),
          }),
        }),
      })

      const result = await sut.getProfileByReferralCode('valid-code')

      expect(result).toEqual(profile)
      expect(mockSupabase.from).toHaveBeenCalledWith('profile')
    })

    it('returns null for invalid code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      })

      const result = await sut.getProfileByReferralCode('nonexistent-code')

      expect(result).toBeNull()
    })
  })

  describe('getReferralStats', () => {
    it('returns correct counts and referral list', async () => {
      const referrals = [
        { referred_user_id: 'ref-1', created_at: '2026-01-15T12:00:00.000Z' },
        { referred_user_id: 'ref-2', created_at: '2026-01-10T12:00:00.000Z' },
      ]
      const profiles = [
        { user_id: 'ref-1', name: 'Alice' },
        { user_id: 'ref-2', name: 'Bob' },
      ]

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { referral_code: 'my-code' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: referrals, error: null }),
            }),
          }),
        }
      })
      mockSupabase.rpc.mockResolvedValue({ data: profiles, error: null })

      const result = await sut.getReferralStats('user-123')

      expect(result.referral_code).toBe('my-code')
      expect(result.total_referrals).toBe(2)
      expect(result.total_pro_days_earned).toBe(14)
      expect(result.referrals).toEqual([
        { referred_name: 'Alice', created_at: '2026-01-15T12:00:00.000Z' },
        { referred_name: 'Bob', created_at: '2026-01-10T12:00:00.000Z' },
      ])
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_referred_user_names', {
        p_referred_user_ids: ['ref-1', 'ref-2'],
      })
    })

    it('returns zero stats for user with no referrals', async () => {
      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { referral_code: 'my-code' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      })

      const result = await sut.getReferralStats('user-123')

      expect(result.referral_code).toBe('my-code')
      expect(result.total_referrals).toBe(0)
      expect(result.total_pro_days_earned).toBe(0)
      expect(result.referrals).toEqual([])
    })

    it('returns empty stats on referral query error', async () => {
      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { referral_code: 'my-code' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }
      })

      const result = await sut.getReferralStats('user-123')

      expect(result.referral_code).toBe('my-code')
      expect(result.total_referrals).toBe(0)
      expect(result.total_pro_days_earned).toBe(0)
      expect(result.referrals).toEqual([])
    })
  })

  describe('getUserReferralCode', () => {
    it('returns code for user with code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { referral_code: 'user-code' },
              error: null,
            }),
          }),
        }),
      })

      const result = await sut.getUserReferralCode('user-123')

      expect(result).toBe('user-code')
    })

    it('returns null when user has no code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const result = await sut.getUserReferralCode('user-123')

      expect(result).toBeNull()
    })
  })

  describe('claimReferral', () => {
    it('calls RPC and returns pro_days_granted', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { pro_days_granted: 7 },
        error: null,
      })

      const result = await sut.claimReferral('referrer-code', 'referred-user-id')

      expect(result).toEqual({ pro_days_granted: 7 })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_referral_reward', {
        p_referral_code: 'referrer-code',
        p_referred_user_id: 'referred-user-id',
      })
    })

    it('propagates self_referral Postgres exception', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'self_referral' },
      })

      await expect(sut.claimReferral('my-code', 'my-user-id')).rejects.toThrow('self_referral')
    })

    it('propagates already_referred Postgres exception', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'already_referred' },
      })

      await expect(sut.claimReferral('some-code', 'user-id')).rejects.toThrow('already_referred')
    })

    it('propagates invalid_referral_code Postgres exception', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'invalid_referral_code' },
      })

      await expect(sut.claimReferral('bad-code', 'user-id')).rejects.toThrow(
        'invalid_referral_code'
      )
    })
  })

  describe('hasBeenReferred', () => {
    it('returns true for referred user', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'referral-123' },
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await sut.hasBeenReferred('user-123')

      expect(result).toBe(true)
    })

    it('returns false for non-referred user', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      })

      const result = await sut.hasBeenReferred('user-123')

      expect(result).toBe(false)
    })
  })
})
