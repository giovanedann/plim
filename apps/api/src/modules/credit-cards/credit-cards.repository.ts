import type { CreateCreditCard, CreditCard, UpdateCreditCard } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const CREDIT_CARD_COLUMNS =
  'id, user_id, name, color, flag, bank, last_4_digits, expiration_day, closing_day, credit_limit_cents, is_active, created_at, updated_at'

export class CreditCardsRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<CreditCard[]> {
    const { data, error } = await this.supabase
      .from('credit_card')
      .select(CREDIT_CARD_COLUMNS)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name')

    if (error) return []

    return data as CreditCard[]
  }

  async findById(id: string, userId: string): Promise<CreditCard | null> {
    const { data, error } = await this.supabase
      .from('credit_card')
      .select(CREDIT_CARD_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as CreditCard
  }

  async countByUserId(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('credit_card')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    return count ?? 0
  }

  async create(userId: string, input: CreateCreditCard): Promise<CreditCard | null> {
    const { data, error } = await this.supabase
      .from('credit_card')
      .insert({
        user_id: userId,
        name: input.name,
        color: input.color,
        flag: input.flag,
        bank: input.bank,
        last_4_digits: input.last_4_digits ?? null,
        expiration_day: input.expiration_day ?? null,
        closing_day: input.closing_day ?? null,
        credit_limit_cents: input.credit_limit_cents ?? null,
      })
      .select(CREDIT_CARD_COLUMNS)
      .single()

    if (error || !data) return null

    return data as CreditCard
  }

  async update(id: string, userId: string, input: UpdateCreditCard): Promise<CreditCard | null> {
    const { data, error } = await this.supabase
      .from('credit_card')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(CREDIT_CARD_COLUMNS)
      .single()

    if (error || !data) return null

    return data as CreditCard
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('credit_card')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    return !error && (count ?? 0) > 0
  }
}
