import type { ValidateReferralCodeResponse } from '@plim/shared'
import type { ReferralRepository } from './referral.repository'

export class ValidateReferralCodeUseCase {
  constructor(private referralRepository: ReferralRepository) {}

  async execute(code: string): Promise<ValidateReferralCodeResponse> {
    if (!code) {
      return { valid: false, referrer_name: null }
    }

    const profile = await this.referralRepository.getProfileByReferralCode(code)

    if (!profile) {
      return { valid: false, referrer_name: null }
    }

    const firstName = profile.name ? (profile.name.split(' ')[0] ?? null) : null

    return { valid: true, referrer_name: firstName }
  }
}
