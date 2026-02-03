import type { AIRepository, UsageInfo } from './ai.repository'

export interface UsageLimitResult {
  allowed: boolean
  usageInfo: UsageInfo
}

export class CheckUsageLimitUseCase {
  constructor(private repository: AIRepository) {}

  async execute(userId: string): Promise<UsageLimitResult> {
    const usageInfo = await this.repository.getUsageInfo(userId)

    const allowed = usageInfo.tier === 'unlimited' || usageInfo.remainingRequests > 0

    return {
      allowed,
      usageInfo,
    }
  }
}
