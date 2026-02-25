import type { CreateInvoice, Expense, Invoice, UpdateInvoice } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const INVOICE_COLUMNS =
  'id, user_id, credit_card_id, reference_month, cycle_start, cycle_end, total_amount_cents, paid_amount_cents, carry_over_cents, status, paid_at, created_at, updated_at'

const EXPENSE_COLUMNS =
  'id, user_id, type, category_id, description, amount_cents, payment_method, date, is_recurrent, recurrence_day, recurrence_start, recurrence_end, installment_current, installment_total, installment_group_id, recurrent_group_id, credit_card_id, invoice_id, created_at, updated_at'

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

  async sumFutureInstallments(
    creditCardId: string,
    userId: string,
    afterDate: string
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('expense')
      .select('amount_cents')
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gt('date', afterDate)
      .not('installment_group_id', 'is', null)

    if (error || !data) return 0

    return (data as { amount_cents: number }[]).reduce((sum, row) => sum + row.amount_cents, 0)
  }

  async sumActiveRecurrences(creditCardId: string, userId: string, today: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('expense')
      .select('amount_cents, recurrent_group_id')
      .eq('credit_card_id', creditCardId)
      .eq('user_id', userId)
      .eq('is_recurrent', true)
      .or(`recurrence_end.is.null,recurrence_end.gte.${today}`)

    if (error || !data) return 0

    const seen = new Set<string>()
    let total = 0
    for (const row of data as { amount_cents: number; recurrent_group_id: string | null }[]) {
      if (row.recurrent_group_id && seen.has(row.recurrent_group_id)) continue
      if (row.recurrent_group_id) seen.add(row.recurrent_group_id)
      total += row.amount_cents
    }
    return total
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
      .is('invoice_id', null)
      .gte('date', cycleStart)
      .lte('date', cycleEnd)
      .order('date')

    if (error) return []

    return data as Expense[]
  }

  async findRemainderExpense(invoiceId: string, userId: string): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(EXPENSE_COLUMNS)
      .eq('invoice_id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as Expense
  }

  async createRemainderExpense(
    userId: string,
    invoiceId: string,
    creditCardId: string,
    amountCents: number,
    description: string,
    date: string
  ): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .insert({
        user_id: userId,
        type: 'expense',
        category_id: null,
        description,
        amount_cents: amountCents,
        payment_method: 'pix',
        date,
        credit_card_id: creditCardId,
        invoice_id: invoiceId,
      })
      .select(EXPENSE_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Expense
  }

  async deleteRemainderExpense(invoiceId: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('expense')
      .delete({ count: 'exact' })
      .eq('invoice_id', invoiceId)
      .eq('user_id', userId)

    return !error && (count ?? 0) > 0
  }
}
