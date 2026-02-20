import type { ReferralStats } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetReferralStatsUseCase } from './get-referral-stats.usecase'
import type { ReferralRepository } from './referral.repository'

type MockRepository = Pick<ReferralRepository, 'getReferralStats'>

function createMockRepository(): MockRepository {
  return {
    getReferralStats: vi.fn(),
  }
}

function createMockStats(overrides: Partial<ReferralStats> = {}): ReferralStats {
  return {
    referral_code: 'test-code',
    referral_url: '',
    total_referrals: 0,
    total_pro_days_earned: 0,
    referrals: [],
    ...overrides,
  }
}

describe('GetReferralStatsUseCase', () => {
  let sut: GetReferralStatsUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetReferralStatsUseCase(mockRepository as ReferralRepository)
  })

  it('returns correct referral code and URL', async () => {
    const stats = createMockStats({ referral_code: 'giovane' })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.referral_code).toBe('giovane')
    expect(result.referral_url).toBe('https://plim.pro/r/giovane')
  })

  it('returns correct total referrals count', async () => {
    const stats = createMockStats({
      referral_code: 'test-code',
      total_referrals: 5,
      referrals: [
        { referred_name: 'Alice', created_at: '2026-01-01T00:00:00.000Z' },
        { referred_name: 'Bob', created_at: '2026-01-02T00:00:00.000Z' },
        { referred_name: 'Carol', created_at: '2026-01-03T00:00:00.000Z' },
        { referred_name: 'Dave', created_at: '2026-01-04T00:00:00.000Z' },
        { referred_name: 'Eve', created_at: '2026-01-05T00:00:00.000Z' },
      ],
    })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.total_referrals).toBe(5)
  })

  it('calculates total Pro days earned (referrals * 7)', async () => {
    const stats = createMockStats({
      referral_code: 'test-code',
      total_referrals: 3,
      total_pro_days_earned: 21,
      referrals: [
        { referred_name: 'Alice', created_at: '2026-01-01T00:00:00.000Z' },
        { referred_name: 'Bob', created_at: '2026-01-02T00:00:00.000Z' },
        { referred_name: 'Carol', created_at: '2026-01-03T00:00:00.000Z' },
      ],
    })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.total_pro_days_earned).toBe(21)
    expect(result.total_pro_days_earned).toBe(result.total_referrals * 7)
  })

  it('returns referral list with names and dates', async () => {
    const referrals = [
      { referred_name: 'Alice', created_at: '2026-02-01T10:00:00.000Z' },
      { referred_name: 'Bob', created_at: '2026-02-02T14:30:00.000Z' },
    ]
    const stats = createMockStats({
      referral_code: 'test-code',
      total_referrals: 2,
      total_pro_days_earned: 14,
      referrals,
    })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.referrals).toHaveLength(2)
    expect(result.referrals[0]).toEqual({
      referred_name: 'Alice',
      created_at: '2026-02-01T10:00:00.000Z',
    })
    expect(result.referrals[1]).toEqual({
      referred_name: 'Bob',
      created_at: '2026-02-02T14:30:00.000Z',
    })
  })

  it('returns zero stats for user with no referrals', async () => {
    const stats = createMockStats({
      referral_code: 'lonely-user',
      total_referrals: 0,
      total_pro_days_earned: 0,
      referrals: [],
    })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.referral_code).toBe('lonely-user')
    expect(result.referral_url).toBe('https://plim.pro/r/lonely-user')
    expect(result.total_referrals).toBe(0)
    expect(result.total_pro_days_earned).toBe(0)
    expect(result.referrals).toEqual([])
  })

  it('handles user with no referral code gracefully', async () => {
    const stats = createMockStats({
      referral_code: '',
      total_referrals: 0,
      total_pro_days_earned: 0,
      referrals: [],
    })
    mockRepository.getReferralStats = vi.fn().mockResolvedValue(stats)

    const result = await sut.execute('user-123')

    expect(result.referral_code).toBe('')
    expect(result.referral_url).toBe('')
    expect(result.total_referrals).toBe(0)
    expect(result.total_pro_days_earned).toBe(0)
    expect(result.referrals).toEqual([])
  })
})
