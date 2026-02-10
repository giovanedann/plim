import { PLAN_LIMITS, type PlanTier } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ClampDateRangeParams {
  supabase: SupabaseClient
  userId: string
  startDate: string
  endDate: string
}

interface ClampedDateRange {
  start_date: string
  end_date: string
}

export async function clampDateRange({
  supabase,
  userId,
  startDate,
  endDate,
}: ClampDateRangeParams): Promise<ClampedDateRange> {
  const { data } = await supabase.from('subscription').select('tier').eq('user_id', userId).single()

  const tier: PlanTier = (data?.tier as PlanTier) ?? 'free'
  const maxDays = PLAN_LIMITS[tier].dashboard.timeRangeDays

  if (maxDays === Number.POSITIVE_INFINITY) {
    return { start_date: startDate, end_date: endDate }
  }

  const end = new Date(endDate)
  const start = new Date(startDate)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > maxDays) {
    const clampedStart = new Date(end.getTime() - maxDays * 24 * 60 * 60 * 1000)
    return {
      start_date: clampedStart.toISOString().slice(0, 10),
      end_date: endDate,
    }
  }

  return { start_date: startDate, end_date: endDate }
}
