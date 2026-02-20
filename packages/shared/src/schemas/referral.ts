import { z } from 'zod'

export const referralCodeSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9-]+$/)

export const validateReferralCodeResponseSchema = z.object({
  valid: z.boolean(),
  referrer_name: z.string().nullable(),
})

export const referralStatsSchema = z.object({
  referral_code: z.string(),
  referral_url: z.string(),
  total_referrals: z.number().int().nonnegative(),
  total_pro_days_earned: z.number().int().nonnegative(),
  referrals: z.array(
    z.object({
      referred_name: z.string().nullable(),
      created_at: z.string(),
    })
  ),
})

export const claimReferralResponseSchema = z.object({
  pro_days_granted: z.number().int().nonnegative(),
})

export type ReferralCode = z.infer<typeof referralCodeSchema>
export type ValidateReferralCodeResponse = z.infer<typeof validateReferralCodeResponseSchema>
export type ReferralStats = z.infer<typeof referralStatsSchema>
export type ClaimReferralResponse = z.infer<typeof claimReferralResponseSchema>
