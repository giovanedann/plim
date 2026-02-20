import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { ClaimReferralUseCase } from './claim-referral.usecase'
import { GetReferralStatsUseCase } from './get-referral-stats.usecase'
import { ReferralRepository } from './referral.repository'
import { ValidateReferralCodeUseCase } from './validate-referral-code.usecase'

export interface ReferralDependencies {
  repository: ReferralRepository
  validateReferralCode: ValidateReferralCodeUseCase
  getReferralStats: GetReferralStatsUseCase
  claimReferral: ClaimReferralUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createReferralDependencies(
  options: CreateDependenciesOptions
): ReferralDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new ReferralRepository(supabase)
  return {
    repository,
    validateReferralCode: new ValidateReferralCodeUseCase(repository),
    getReferralStats: new GetReferralStatsUseCase(repository),
    claimReferral: new ClaimReferralUseCase(repository),
  }
}
