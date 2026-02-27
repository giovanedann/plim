import type { Category, CreditCard, Expense } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function findCategoryByName(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('category')
    .select('id, user_id, name, icon, color, is_active, created_at, updated_at')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_active', true)
    .ilike('name', name)
    .limit(1)
    .single()

  if (error || !data) return null

  return data as Category
}

export async function findCreditCardByName(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<CreditCard | null> {
  const { data, error } = await supabase
    .from('credit_card')
    .select(
      'id, user_id, name, color, flag, bank, last_4_digits, is_active, created_at, updated_at'
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single()

  if (error || !data) return null

  return data as CreditCard
}

export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100)
}

export function groupExpenses(
  expenses: Expense[],
  groupBy: string
): Record<string, { total: number; count: number }> {
  const groups: Record<string, { total: number; count: number }> = {}

  for (const expense of expenses) {
    let key: string

    switch (groupBy) {
      case 'category':
        key = expense.category_id ?? 'uncategorized'
        break
      case 'payment_method':
        key = expense.payment_method
        break
      case 'day':
        key = expense.date
        break
      case 'month':
        key = expense.date.slice(0, 7)
        break
      default:
        key = 'other'
    }

    const existing = groups[key]
    if (existing) {
      existing.total += expense.amount_cents
      existing.count += 1
    } else {
      groups[key] = { total: expense.amount_cents, count: 1 }
    }
  }

  return groups
}
