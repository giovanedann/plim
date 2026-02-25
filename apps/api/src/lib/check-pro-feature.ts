import {
  ERROR_CODES,
  HTTP_STATUS,
  PRO_FEATURES,
  type PlanTier,
  type ProFeatureKey,
} from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../middleware/error-handler.middleware'

export async function checkProFeature(
  supabase: SupabaseClient,
  userId: string,
  feature: ProFeatureKey
): Promise<void> {
  const { data } = await supabase.from('subscription').select('tier').eq('user_id', userId).single()

  const tier: PlanTier = (data?.tier as PlanTier) ?? 'free'
  const allowed = PRO_FEATURES[tier][feature]

  if (!allowed) {
    throw new AppError(ERROR_CODES.LIMIT_EXCEEDED, 'Pro feature required', HTTP_STATUS.FORBIDDEN, {
      feature,
      limit: 0,
      current: 0,
    })
  }
}
