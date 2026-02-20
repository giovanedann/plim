import type { ReferralStats } from '@plim/shared'
import type { ReferralRepository } from './referral.repository'

const REFERRAL_BASE_URL = 'https://plim.app.br/r'

export class GetReferralStatsUseCase {
  constructor(private referralRepository: ReferralRepository) {}

  async execute(userId: string): Promise<ReferralStats> {
    const stats = await this.referralRepository.getReferralStats(userId)

    const referralUrl = stats.referral_code ? `${REFERRAL_BASE_URL}/${stats.referral_code}` : ''

    return {
      ...stats,
      referral_url: referralUrl,
    }
  }
}
