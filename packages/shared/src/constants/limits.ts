export type PlanTier = 'free' | 'pro' | 'unlimited'

export interface TierLimits {
  categories: { custom: number }
  creditCards: number
  dashboard: { timeRangeDays: number }
}

export const PLAN_LIMITS: Record<PlanTier, TierLimits> = {
  free: {
    categories: { custom: 5 },
    creditCards: 2,
    dashboard: { timeRangeDays: 30 },
  },
  pro: {
    categories: { custom: Number.POSITIVE_INFINITY },
    creditCards: Number.POSITIVE_INFINITY,
    dashboard: { timeRangeDays: Number.POSITIVE_INFINITY },
  },
  unlimited: {
    categories: { custom: Number.POSITIVE_INFINITY },
    creditCards: Number.POSITIVE_INFINITY,
    dashboard: { timeRangeDays: Number.POSITIVE_INFINITY },
  },
} as const

export type ProFeatureKey = 'invoices'

export interface ProFeatures {
  invoices: boolean
}

export const PRO_FEATURES: Record<PlanTier, ProFeatures> = {
  free: { invoices: false },
  pro: { invoices: true },
  unlimited: { invoices: true },
} as const
