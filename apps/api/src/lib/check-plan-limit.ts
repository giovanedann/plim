import {
  ERROR_CODES,
  HTTP_STATUS,
  type LimitExceededDetails,
  PLAN_LIMITS,
  type PlanTier,
} from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../middleware/error-handler.middleware'

type FeatureKey = 'categories.custom' | 'creditCards' | 'dashboard.timeRangeDays'

function getLimitForFeature(tier: PlanTier, feature: FeatureKey): number {
  switch (feature) {
    case 'categories.custom':
      return PLAN_LIMITS[tier].categories.custom
    case 'creditCards':
      return PLAN_LIMITS[tier].creditCards
    case 'dashboard.timeRangeDays':
      return PLAN_LIMITS[tier].dashboard.timeRangeDays
  }
}

interface CheckPlanLimitParams {
  supabase: SupabaseClient
  userId: string
  feature: FeatureKey
  currentCount: number
}

export async function checkPlanLimit({
  supabase,
  userId,
  feature,
  currentCount,
}: CheckPlanLimitParams): Promise<void> {
  const { data } = await supabase.from('subscription').select('tier').eq('user_id', userId).single()

  const tier: PlanTier = (data?.tier as PlanTier) ?? 'free'
  const limit = getLimitForFeature(tier, feature)

  if (currentCount >= limit) {
    throw new AppError(ERROR_CODES.LIMIT_EXCEEDED, 'Plan limit exceeded', HTTP_STATUS.FORBIDDEN, {
      feature,
      limit,
      current: currentCount,
    } satisfies LimitExceededDetails)
  }
}
