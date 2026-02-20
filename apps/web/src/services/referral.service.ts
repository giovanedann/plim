import { type ApiResponse, api } from '@/lib/api-client'
import type {
  ClaimReferralResponse,
  ReferralStats,
  ValidateReferralCodeResponse,
} from '@plim/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export const referralService = {
  async validateCode(code: string): Promise<ApiResponse<ValidateReferralCodeResponse>> {
    const url = `${API_URL}/api/v1/referral/validate/${encodeURIComponent(code)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: errorData.error || {
          code: 'REQUEST_FAILED',
          message: `Request failed with status ${response.status}`,
        },
      }
    }

    return (await response.json()) as ApiResponse<ValidateReferralCodeResponse>
  },

  async getReferralStats(): Promise<ApiResponse<ReferralStats>> {
    return api.get<ReferralStats>('/referral/stats')
  },

  async claimReferral(code: string): Promise<ApiResponse<ClaimReferralResponse>> {
    return api.post<ClaimReferralResponse>('/referral/claim', { referral_code: code })
  },
}
