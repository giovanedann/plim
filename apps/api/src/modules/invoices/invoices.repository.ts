import type { CreateInvoice, Expense, Invoice, UpdateInvoice } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const INVOICE_COLUMNS =
  'id, user_id, credit_card_id, reference_month, cycle_start, cycle_end, total_amount_cents, paid_amount_cents, carry_over_cents, status, paid_at, created_at, updated_at'

const EXPENSE_COLUMNS =
  'id, user_id, type, category_id, description, amount_cents, payment_method, date, is_recurrent, recurrence_day, recurrence_start, recurrence_end, installment_current, installment_total, installment_group_id, recurrent_group_id, credit_card_id, created_at, updated_at'

export class InvoicesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByCardAndMonth(
    creditCardId: string,
    userId: string,
    referenceMonth: string
  ): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoice')
      .select(INVOICE_COLUMNS)
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .eq('reference_month', referenceMonth)
      .single()

    if (error || !data) return null

    return data as Invoice
  }

  async findByCard(creditCardId: string, userId: string): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from('invoice')
      .select(INVOICE_COLUMNS)
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .order('reference_month', { ascending: false })

    if (error) return []

    return data as Invoice[]
  }

  async findUnpaidByCard(creditCardId: string, userId: string): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from('invoice')
      .select(INVOICE_COLUMNS)
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .neq('status', 'paid')
      .order('reference_month', { ascending: false })

    if (error) return []

    return data as Invoice[]
  }

  async findById(id: string, userId: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoice')
      .select(INVOICE_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as Invoice
  }

  async create(userId: string, input: CreateInvoice): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoice')
      .insert({
        user_id: userId,
        credit_card_id: input.credit_card_id,
        reference_month: input.reference_month,
        cycle_start: input.cycle_start,
        cycle_end: input.cycle_end,
        total_amount_cents: input.total_amount_cents,
        paid_amount_cents: input.paid_amount_cents ?? 0,
        carry_over_cents: input.carry_over_cents ?? 0,
        status: input.status ?? 'open',
      })
      .select(INVOICE_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Invoice
  }

  async update(id: string, userId: string, input: UpdateInvoice): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoice')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(INVOICE_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Invoice
  }

  async getTransactionsForCycle(
    creditCardId: string,
    userId: string,
    cycleStart: string,
    cycleEnd: string
  ): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(EXPENSE_COLUMNS)
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', cycleStart)
      .lte('date', cycleEnd)
      .order('date')

    if (error) return []

    return data as Expense[]
  }
}
