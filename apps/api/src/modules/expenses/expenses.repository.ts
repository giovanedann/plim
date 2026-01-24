import type { Expense, ExpenseFilters, UpdateExpense } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

const EXPENSE_COLUMNS = `
  id,
  user_id,
  category_id,
  description,
  amount_cents,
  payment_method,
  date,
  is_recurrent,
  recurrence_day,
  recurrence_start,
  recurrence_end,
  installment_current,
  installment_total,
  installment_group_id,
  credit_card_id,
  created_at,
  updated_at
`

export interface CreateExpenseData {
  category_id: string
  description: string
  amount_cents: number
  payment_method: string
  date: string
  is_recurrent?: boolean
  recurrence_day?: number | null
  recurrence_start?: string | null
  recurrence_end?: string | null
  installment_current?: number | null
  installment_total?: number | null
  installment_group_id?: string | null
  credit_card_id?: string | null
}

export class ExpensesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string, filters?: ExpenseFilters): Promise<Expense[]> {
    let query = this.supabase.from('expense').select(EXPENSE_COLUMNS).eq('user_id', userId)

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method)
    }

    if (filters?.expense_type) {
      switch (filters.expense_type) {
        case 'one_time':
          query = query.eq('is_recurrent', false).is('installment_total', null)
          break
        case 'recurrent':
          query = query.eq('is_recurrent', true)
          break
        case 'installment':
          query = query.not('installment_total', 'is', null)
          break
      }
    }

    if (filters?.credit_card_id) {
      if (filters.credit_card_id === 'none') {
        query = query.is('credit_card_id', null)
      } else {
        query = query.eq('credit_card_id', filters.credit_card_id)
      }
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) return []

    return data as Expense[]
  }

  async findRecurrentByUserId(userId: string): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(EXPENSE_COLUMNS)
      .eq('user_id', userId)
      .eq('is_recurrent', true)
      .order('description')

    if (error) return []

    return data as Expense[]
  }

  async findById(id: string, userId: string): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(EXPENSE_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as Expense
  }

  async create(userId: string, input: CreateExpenseData): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .insert({
        user_id: userId,
        category_id: input.category_id,
        description: input.description,
        amount_cents: input.amount_cents,
        payment_method: input.payment_method,
        date: input.date,
        is_recurrent: input.is_recurrent ?? false,
        recurrence_day: input.recurrence_day ?? null,
        recurrence_start: input.recurrence_start ?? null,
        recurrence_end: input.recurrence_end ?? null,
        installment_current: input.installment_current ?? null,
        installment_total: input.installment_total ?? null,
        installment_group_id: input.installment_group_id ?? null,
        credit_card_id: input.credit_card_id ?? null,
      })
      .select(EXPENSE_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Expense
  }

  async createMany(userId: string, inputs: CreateExpenseData[]): Promise<Expense[]> {
    const records = inputs.map((input) => ({
      user_id: userId,
      category_id: input.category_id,
      description: input.description,
      amount_cents: input.amount_cents,
      payment_method: input.payment_method,
      date: input.date,
      is_recurrent: input.is_recurrent ?? false,
      recurrence_day: input.recurrence_day ?? null,
      recurrence_start: input.recurrence_start ?? null,
      recurrence_end: input.recurrence_end ?? null,
      installment_current: input.installment_current ?? null,
      installment_total: input.installment_total ?? null,
      installment_group_id: input.installment_group_id ?? null,
      credit_card_id: input.credit_card_id ?? null,
    }))

    const { data, error } = await this.supabase
      .from('expense')
      .insert(records)
      .select(EXPENSE_COLUMNS)

    if (error || !data) return []

    return data as Expense[]
  }

  async update(id: string, userId: string, input: UpdateExpense): Promise<Expense | null> {
    const { data, error } = await this.supabase
      .from('expense')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(EXPENSE_COLUMNS)
      .single()

    if (error || !data) return null

    return data as Expense
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('expense')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId)

    return !error && (count ?? 0) > 0
  }

  async deleteByGroupId(groupId: string, userId: string): Promise<boolean> {
    const { error, count } = await this.supabase
      .from('expense')
      .delete({ count: 'exact' })
      .eq('installment_group_id', groupId)
      .eq('user_id', userId)

    return !error && (count ?? 0) > 0
  }

  async findByGroupId(groupId: string, userId: string): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expense')
      .select(EXPENSE_COLUMNS)
      .eq('installment_group_id', groupId)
      .eq('user_id', userId)
      .order('installment_current', { ascending: true })

    if (error) return []

    return data as Expense[]
  }
}
