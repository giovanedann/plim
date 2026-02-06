import type { AIRepository, UsageInfo } from './ai.repository'

export type RequestType = 'text' | 'voice' | 'image'

export interface UsageLimitResult {
  allowed: boolean
  usageInfo: UsageInfo
  requestType: RequestType
}

export class CheckUsageLimitUseCase {
  constructor(private repository: AIRepository) {}

  async execute(userId: string, requestType: RequestType = 'text'): Promise<UsageLimitResult> {
    // Inline PIX expiration check: downgrade expired PIX Pro users before checking limits
    const subscription = await this.repository.getSubscription(userId)
    if (
      subscription.tier === 'pro' &&
      subscription.payment_method === 'pix' &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) < new Date()
    ) {
      await this.repository.downgradeExpiredPix(userId)
    }

    const usageInfo = await this.repository.getUsageInfo(userId)

    // Unlimited tier has no restrictions
    if (usageInfo.tier === 'unlimited') {
      return { allowed: true, usageInfo, requestType }
    }

    // Check specific limit for the request type
    const typeUsage = usageInfo[requestType]
    const allowed = typeUsage.remaining > 0

    return {
      allowed,
      usageInfo,
      requestType,
    }
  }
}
