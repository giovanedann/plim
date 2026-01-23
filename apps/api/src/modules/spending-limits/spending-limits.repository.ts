import type { SpendingLimit, UpsertSpendingLimit } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const SPENDING_LIMIT_COLUMNS = 'id, user_id, year_month, amount_cents, created_at, updated_at'

export class SpendingLimitsRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByMonth(userId: string, yearMonth: string): Promise<SpendingLimit | null> {
    const { data, error } = await this.supabase
      .from('spending_limit')
      .select(SPENDING_LIMIT_COLUMNS)
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .single()

    if (error || !data) return null

    return data as SpendingLimit
  }

  async findMostRecentBefore(userId: string, yearMonth: string): Promise<SpendingLimit | null> {
    const { data, error } = await this.supabase
      .from('spending_limit')
      .select(SPENDING_LIMIT_COLUMNS)
      .eq('user_id', userId)
      .lte('year_month', yearMonth)
      .order('year_month', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return data as SpendingLimit
  }

  async upsert(userId: string, input: UpsertSpendingLimit): Promise<SpendingLimit | null> {
    const { data, error } = await this.supabase
      .from('spending_limit')
      .upsert(
        {
          user_id: userId,
          year_month: input.year_month,
          amount_cents: input.amount_cents,
        },
        { onConflict: 'user_id,year_month' }
      )
      .select(SPENDING_LIMIT_COLUMNS)
      .single()

    if (error || !data) return null

    return data as SpendingLimit
  }
}
