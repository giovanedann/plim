import type { AIRepository, UsageInfo } from './ai.repository'

export class GetUsageInfoUseCase {
  constructor(private repository: AIRepository) {}

  async execute(userId: string): Promise<UsageInfo> {
    return this.repository.getUsageInfo(userId)
  }
}
