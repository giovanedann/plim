import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ReferralRepository } from './referral.repository'

interface ClaimReferralInput {
  referral_code: string
}

interface ClaimReferralResult {
  pro_days_granted: number
}

const RPC_ERROR_MAP: Record<string, { code: string; status: 400 | 403 | 409 }> = {
  invalid_code: { code: ERROR_CODES.VALIDATION_ERROR, status: HTTP_STATUS.BAD_REQUEST },
  invalid_referral_code: { code: ERROR_CODES.VALIDATION_ERROR, status: HTTP_STATUS.BAD_REQUEST },
  self_referral: { code: ERROR_CODES.FORBIDDEN, status: HTTP_STATUS.FORBIDDEN },
  account_too_old: { code: ERROR_CODES.FORBIDDEN, status: HTTP_STATUS.FORBIDDEN },
  already_referred: { code: ERROR_CODES.ALREADY_EXISTS, status: HTTP_STATUS.CONFLICT },
}

export class ClaimReferralUseCase {
  constructor(private referralRepository: ReferralRepository) {}

  async execute(userId: string, input: ClaimReferralInput): Promise<ClaimReferralResult> {
    try {
      await this.referralRepository.claimReferral(input.referral_code, userId)

      return { pro_days_granted: 7 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      const mapped = RPC_ERROR_MAP[message]

      if (mapped) {
        throw new AppError(mapped.code, message, mapped.status)
      }

      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to claim referral',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}
