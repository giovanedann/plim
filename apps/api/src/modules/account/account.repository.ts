import type { SupabaseClient } from '@supabase/supabase-js'

export type ExportableTable =
  | 'profile'
  | 'expenses'
  | 'categories'
  | 'credit-cards'
  | 'salary-history'

interface ExportLog {
  id: string
  user_id: string
  table_name: string
  exported_at: string
}

interface ProfileEmail {
  email: string
}

export class AccountRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUserEmail(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select('email')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return (data as ProfileEmail).email
  }

  async getLastExportTime(userId: string, tableName: ExportableTable): Promise<Date | null> {
    const { data, error } = await this.supabase
      .from('data_export_log')
      .select('exported_at')
      .eq('user_id', userId)
      .eq('table_name', tableName)
      .maybeSingle()

    if (error) {
      console.error(`Error getting last export time for ${tableName}:`, error)
      return null
    }

    if (!data) return null

    return new Date((data as ExportLog).exported_at)
  }

  async recordExport(userId: string, tableName: ExportableTable): Promise<boolean> {
    const { error } = await this.supabase.from('data_export_log').upsert(
      {
        user_id: userId,
        table_name: tableName,
        exported_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,table_name' }
    )

    if (error) {
      console.error(`Error recording export for ${tableName}:`, error)
    }

    return !error
  }

  async exportProfileAsCsv(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, created_at, updated_at'
      )
      .eq('user_id', userId)
      .csv()

    if (error) {
      console.error('Error exporting profile:', error)
      return null
    }
    return data ?? ''
  }

  async exportExpensesAsCsv(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(
        'id, description, amount_cents, date, payment_method, category_id, credit_card_id, is_recurrent, recurrence_day, recurrence_start, recurrence_end, installment_current, installment_total, installment_group_id, created_at, updated_at'
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .csv()

    if (error) {
      console.error('Error exporting expenses:', error)
      return null
    }
    return data ?? ''
  }

  async exportCategoriesAsCsv(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('category')
      .select('id, name, icon, color, is_active, created_at, updated_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('name', { ascending: true })
      .csv()

    if (error) {
      console.error('Error exporting categories:', error)
      return null
    }
    return data ?? ''
  }

  async exportCreditCardsAsCsv(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('credit_card')
      .select('id, name, color, flag, bank, last_4_digits, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .csv()

    if (error) {
      console.error('Error exporting credit cards:', error)
      return null
    }
    return data ?? ''
  }

  async exportSalaryHistoryAsCsv(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('salary_history')
      .select('id, amount_cents, effective_from, created_at')
      .eq('user_id', userId)
      .order('effective_from', { ascending: false })
      .csv()

    if (error) {
      console.error('Error exporting salary history:', error)
      return null
    }
    return data ?? ''
  }
}
