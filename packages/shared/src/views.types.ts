import type { Database as GeneratedDatabase, Json } from './database.types'

export type { Json }

type PaymentMethod = GeneratedDatabase['public']['Enums']['payment_method']
type InvoiceStatus = GeneratedDatabase['public']['Enums']['invoice_status']

interface ExpenseView {
  Row: {
    id: string
    user_id: string
    category_id: string | null
    description: string
    amount_cents: number
    payment_method: PaymentMethod
    date: string
    type: string
    is_recurrent: boolean
    recurrence_day: number | null
    recurrence_start: string | null
    recurrence_end: string | null
    installment_current: number | null
    installment_total: number | null
    installment_group_id: string | null
    recurrent_group_id: string | null
    credit_card_id: string | null
    invoice_id: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    category_id?: string | null
    description: string
    amount_cents: number
    payment_method: PaymentMethod
    date: string
    type?: string
    is_recurrent?: boolean
    recurrence_day?: number | null
    recurrence_start?: string | null
    recurrence_end?: string | null
    installment_current?: number | null
    installment_total?: number | null
    installment_group_id?: string | null
    recurrent_group_id?: string | null
    credit_card_id?: string | null
    invoice_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    category_id?: string | null
    description?: string
    amount_cents?: number
    payment_method?: PaymentMethod
    date?: string
    type?: string
    is_recurrent?: boolean
    recurrence_day?: number | null
    recurrence_start?: string | null
    recurrence_end?: string | null
    installment_current?: number | null
    installment_total?: number | null
    installment_group_id?: string | null
    recurrent_group_id?: string | null
    credit_card_id?: string | null
    invoice_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

interface CreditCardView {
  Row: {
    id: string
    user_id: string
    name: string
    color: string
    flag: string
    bank: string
    last_4_digits: string | null
    expiration_day: number | null
    closing_day: number | null
    credit_limit_cents: number | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    name: string
    color: string
    flag: string
    bank: string
    last_4_digits?: string | null
    expiration_day?: number | null
    closing_day?: number | null
    credit_limit_cents?: number | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    name?: string
    color?: string
    flag?: string
    bank?: string
    last_4_digits?: string | null
    expiration_day?: number | null
    closing_day?: number | null
    credit_limit_cents?: number | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

interface InvoiceView {
  Row: {
    id: string
    user_id: string
    credit_card_id: string
    reference_month: string
    cycle_start: string
    cycle_end: string
    total_amount_cents: number | null
    paid_amount_cents: number | null
    carry_over_cents: number | null
    status: InvoiceStatus
    paid_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    credit_card_id: string
    reference_month: string
    cycle_start: string
    cycle_end: string
    total_amount_cents?: number | null
    paid_amount_cents?: number | null
    carry_over_cents?: number | null
    status?: InvoiceStatus
    paid_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    credit_card_id?: string
    reference_month?: string
    cycle_start?: string
    cycle_end?: string
    total_amount_cents?: number | null
    paid_amount_cents?: number | null
    carry_over_cents?: number | null
    status?: InvoiceStatus
    paid_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

interface SalaryHistoryView {
  Row: {
    id: string
    user_id: string
    amount_cents: number | null
    effective_from: string
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    amount_cents?: number | null
    effective_from: string
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    amount_cents?: number | null
    effective_from?: string
    created_at?: string
  }
  Relationships: []
}

type GeneratedPublic = GeneratedDatabase['public']

export type Database = {
  __InternalSupabase: GeneratedDatabase['__InternalSupabase']
  public: {
    Tables: GeneratedPublic['Tables']
    Views: {
      expense: ExpenseView
      credit_card: CreditCardView
      invoice: InvoiceView
      salary_history: SalaryHistoryView
    }
    Functions: GeneratedPublic['Functions']
    Enums: GeneratedPublic['Enums']
    CompositeTypes: GeneratedPublic['CompositeTypes']
  }
}
