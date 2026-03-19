import type { CreateSalary, SalaryHistory } from '@plim/shared'
import type { Database } from '@plim/shared/database'
import type { SupabaseClient } from '@supabase/supabase-js'

const SALARY_COLUMNS = 'id, user_id, amount_cents, effective_from, created_at'

export class SalaryRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findActiveForMonth(userId: string, month: string): Promise<SalaryHistory | null> {
    const firstDayOfMonth = `${month}-01`

    const { data, error } = await this.supabase
      .from('salary_history')
      .select(SALARY_COLUMNS)
      .eq('user_id', userId)
      .lte('effective_from', firstDayOfMonth)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return data as SalaryHistory
  }

  async findAllByUserId(userId: string): Promise<SalaryHistory[]> {
    const { data, error } = await this.supabase
      .from('salary_history')
      .select(SALARY_COLUMNS)
      .eq('user_id', userId)
      .order('effective_from', { ascending: false })

    if (error) return []

    return data as SalaryHistory[]
  }

  async create(userId: string, input: CreateSalary): Promise<SalaryHistory | null> {
    const { data, error } = await this.supabase.rpc('upsert_salary', {
      p_user_id: userId,
      p_amount_cents: input.amount_cents,
      p_effective_from: input.effective_from,
    })

    if (error || !data) return null

    return data as SalaryHistory
  }
}
