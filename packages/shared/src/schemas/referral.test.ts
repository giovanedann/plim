import { describe, expect, it } from 'vitest'
import {
  claimReferralResponseSchema,
  referralCodeSchema,
  referralStatsSchema,
  validateReferralCodeResponseSchema,
} from './referral'

describe('referralCodeSchema', () => {
  const sut = referralCodeSchema

  it('accepts valid code with name and hash', () => {
    const result = sut.safeParse('giovane-daniel-a7x9')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('giovane-daniel-a7x9')
    }
  })

  it('accepts valid code with name and numbers', () => {
    const result = sut.safeParse('ana-1234')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('ana-1234')
    }
  })

  it('accepts minimum length code (3 chars)', () => {
    const result = sut.safeParse('abc')

    expect(result.success).toBe(true)
  })

  it('accepts maximum length code (30 chars)', () => {
    const result = sut.safeParse('a'.repeat(30))

    expect(result.success).toBe(true)
  })

  it('accepts code with only lowercase letters', () => {
    const result = sut.safeParse('referralcode')

    expect(result.success).toBe(true)
  })

  it('accepts code with only numbers', () => {
    const result = sut.safeParse('12345')

    expect(result.success).toBe(true)
  })

  it('accepts code with hyphens', () => {
    const result = sut.safeParse('my-referral-code')

    expect(result.success).toBe(true)
  })

  it('rejects code with uppercase letters', () => {
    const result = sut.safeParse('Giovane-Daniel')

    expect(result.success).toBe(false)
  })

  it('rejects code with spaces', () => {
    const result = sut.safeParse('giovane daniel')

    expect(result.success).toBe(false)
  })

  it('rejects code with special characters', () => {
    const result = sut.safeParse('giovane@daniel!')

    expect(result.success).toBe(false)
  })

  it('rejects code with underscores', () => {
    const result = sut.safeParse('giovane_daniel')

    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = sut.safeParse('')

    expect(result.success).toBe(false)
  })

  it('rejects code shorter than 3 characters', () => {
    const result = sut.safeParse('ab')

    expect(result.success).toBe(false)
  })

  it('rejects code longer than 30 characters', () => {
    const result = sut.safeParse('a'.repeat(31))

    expect(result.success).toBe(false)
  })
})

describe('validateReferralCodeResponseSchema', () => {
  const sut = validateReferralCodeResponseSchema

  it('accepts valid response with referrer name', () => {
    const response = { valid: true, referrer_name: 'Giovane Daniel' }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(response)
    }
  })

  it('accepts valid response with null referrer name', () => {
    const response = { valid: true, referrer_name: null }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.referrer_name).toBeNull()
    }
  })

  it('accepts invalid code response', () => {
    const response = { valid: false, referrer_name: null }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valid).toBe(false)
    }
  })

  it('rejects response without valid field', () => {
    const result = sut.safeParse({ referrer_name: 'Name' })

    expect(result.success).toBe(false)
  })

  it('rejects response without referrer_name field', () => {
    const result = sut.safeParse({ valid: true })

    expect(result.success).toBe(false)
  })
})

describe('referralStatsSchema', () => {
  const sut = referralStatsSchema

  const validStats = {
    referral_code: 'giovane-daniel-a7x9',
    referral_url: 'https://plim.app/r/giovane-daniel-a7x9',
    total_referrals: 5,
    total_pro_days_earned: 35,
    referrals: [
      { referred_name: 'Ana Silva', created_at: '2026-01-15T10:00:00Z' },
      { referred_name: null, created_at: '2026-01-20T14:30:00Z' },
    ],
  }

  it('accepts valid stats with referrals array', () => {
    const result = sut.safeParse(validStats)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validStats)
    }
  })

  it('accepts stats with empty referrals array', () => {
    const stats = { ...validStats, referrals: [], total_referrals: 0, total_pro_days_earned: 0 }

    const result = sut.safeParse(stats)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.referrals).toEqual([])
    }
  })

  it('accepts stats with null referred_name in referrals', () => {
    const stats = {
      ...validStats,
      referrals: [{ referred_name: null, created_at: '2026-02-01T00:00:00Z' }],
    }

    const result = sut.safeParse(stats)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.referrals[0]?.referred_name).toBeNull()
    }
  })

  it('rejects stats without referral_code', () => {
    const { referral_code: _, ...stats } = validStats

    const result = sut.safeParse(stats)

    expect(result.success).toBe(false)
  })

  it('rejects stats without referral_url', () => {
    const { referral_url: _, ...stats } = validStats

    const result = sut.safeParse(stats)

    expect(result.success).toBe(false)
  })

  it('rejects stats without referrals array', () => {
    const { referrals: _, ...stats } = validStats

    const result = sut.safeParse(stats)

    expect(result.success).toBe(false)
  })

  it('rejects stats with negative total_referrals', () => {
    const stats = { ...validStats, total_referrals: -1 }

    const result = sut.safeParse(stats)

    expect(result.success).toBe(false)
  })

  it('rejects stats with negative total_pro_days_earned', () => {
    const stats = { ...validStats, total_pro_days_earned: -1 }

    const result = sut.safeParse(stats)

    expect(result.success).toBe(false)
  })
})

describe('claimReferralResponseSchema', () => {
  const sut = claimReferralResponseSchema

  it('accepts valid claim response', () => {
    const response = { pro_days_granted: 7 }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(response)
    }
  })

  it('accepts claim response with zero days', () => {
    const result = sut.safeParse({ pro_days_granted: 0 })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.pro_days_granted).toBe(0)
    }
  })

  it('rejects claim response without pro_days_granted', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects claim response with negative days', () => {
    const result = sut.safeParse({ pro_days_granted: -1 })

    expect(result.success).toBe(false)
  })

  it('rejects claim response with non-integer days', () => {
    const result = sut.safeParse({ pro_days_granted: 7.5 })

    expect(result.success).toBe(false)
  })
})
