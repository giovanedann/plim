import type { ReferralStats } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ReferralProfile {
  user_id: string
  name: string
}

interface ClaimReferralResult {
  pro_days_granted: number
}

interface ReferralRow {
  referred_name: string | null
  created_at: string
}

export class ReferralRepository {
  constructor(private supabase: SupabaseClient) {}

  async getProfileByReferralCode(code: string): Promise<ReferralProfile | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select('user_id, name')
      .eq('referral_code', code)
      .single()

    if (error || !data) return null

    return data as ReferralProfile
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const { data: profile } = await this.supabase
      .from('profile')
      .select('referral_code')
      .eq('user_id', userId)
      .single()

    const referralCode = (profile as { referral_code: string } | null)?.referral_code ?? ''

    const { data: referrals, error } = await this.supabase
      .from('referral')
      .select(
        'referred_user_id, pro_days_granted, created_at, profile!referral_referred_user_id_fkey(name)'
      )
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !referrals) {
      return {
        referral_code: referralCode,
        referral_url: '',
        total_referrals: 0,
        total_pro_days_earned: 0,
        referrals: [],
      }
    }

    const rows = referrals as unknown as Array<{
      referred_user_id: string
      pro_days_granted: number
      created_at: string
      profile: { name: string | null } | null
    }>

    const totalProDays = rows.reduce((sum, row) => sum + row.pro_days_granted, 0)

    const referralList: ReferralRow[] = rows.map((row) => ({
      referred_name: row.profile?.name ?? null,
      created_at: row.created_at,
    }))

    return {
      referral_code: referralCode,
      referral_url: '',
      total_referrals: rows.length,
      total_pro_days_earned: totalProDays,
      referrals: referralList,
    }
  }

  async getUserReferralCode(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select('referral_code')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return (data as { referral_code: string }).referral_code
  }

  async claimReferral(referralCode: string, referredUserId: string): Promise<ClaimReferralResult> {
    const { data, error } = await this.supabase.rpc('claim_referral_reward', {
      p_referral_code: referralCode,
      p_referred_user_id: referredUserId,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data as ClaimReferralResult
  }

  async hasBeenReferred(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('referral')
      .select('id')
      .eq('referred_user_id', userId)
      .limit(1)
      .single()

    if (error || !data) return false

    return true
  }
}
