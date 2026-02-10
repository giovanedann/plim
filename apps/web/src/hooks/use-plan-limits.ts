import { PLAN_LIMITS, type TierLimits } from '@plim/shared'
import { useSubscription } from './use-subscription'

type FeatureKey = 'categories.custom' | 'creditCards' | 'dashboard.timeRangeDays'

function getLimitForFeature(limits: TierLimits, feature: FeatureKey): number {
  switch (feature) {
    case 'categories.custom':
      return limits.categories.custom
    case 'creditCards':
      return limits.creditCards
    case 'dashboard.timeRangeDays':
      return limits.dashboard.timeRangeDays
  }
}

interface UsePlanLimitsReturn {
  limits: TierLimits
  isPro: boolean
  isAtLimit: (feature: FeatureKey, current: number) => boolean
  remaining: (feature: FeatureKey, current: number) => number
}

export function usePlanLimits(): UsePlanLimitsReturn {
  const { isPro } = useSubscription()

  const tier = isPro ? 'pro' : 'free'
  const limits = PLAN_LIMITS[tier]

  const isAtLimit = (feature: FeatureKey, current: number): boolean => {
    const limit = getLimitForFeature(limits, feature)
    return current >= limit
  }

  const remaining = (feature: FeatureKey, current: number): number => {
    const limit = getLimitForFeature(limits, feature)
    return limit - current
  }

  return { limits, isPro, isAtLimit, remaining }
}
