import type { SupabaseClient } from '@supabase/supabase-js'

export interface PaymentSubscription {
  id: string
  user_id: string
  tier: 'free' | 'pro' | 'unlimited'
  ai_requests_limit: number
  ai_text_limit: number
  ai_voice_limit: number
  ai_image_limit: number
  payment_method: 'pix' | 'credit_card' | null
  mp_payment_id: string | null
  mp_preapproval_id: string | null
  mp_payment_status: 'pending' | 'approved' | 'cancelled' | 'expired' | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface UpgradeToProInput {
  payment_method: 'pix' | 'credit_card'
  mp_payment_id?: string
  mp_preapproval_id?: string
  period_start: string
  period_end: string
}

export interface PaymentLogInput {
  user_id: string
  mp_payment_id?: string
  mp_preapproval_id?: string
  event_type: string
  amount_cents?: number
  raw_payload: unknown
}

const PRO_LIMITS = {
  ai_requests_limit: 135,
  ai_text_limit: 100,
  ai_voice_limit: 15,
  ai_image_limit: 20,
} as const

const FREE_LIMITS = {
  ai_requests_limit: 20,
  ai_text_limit: 15,
  ai_voice_limit: 2,
  ai_image_limit: 3,
} as const

export class PaymentRepository {
  constructor(private supabase: SupabaseClient) {}

  async getSubscription(userId: string): Promise<PaymentSubscription | null> {
    const { data, error } = await this.supabase
      .from('subscription')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as PaymentSubscription
  }

  async upgradeToPro(userId: string, input: UpgradeToProInput): Promise<PaymentSubscription> {
    const { data, error } = await this.supabase
      .from('subscription')
      .update({
        tier: 'pro',
        payment_method: input.payment_method,
        mp_payment_id: input.mp_payment_id ?? null,
        mp_preapproval_id: input.mp_preapproval_id ?? null,
        mp_payment_status: 'approved',
        current_period_start: input.period_start,
        current_period_end: input.period_end,
        ...PRO_LIMITS,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`Failed to upgrade user ${userId}: ${error?.message}`)
    }

    return data as PaymentSubscription
  }

  async downgradeToFree(userId: string): Promise<PaymentSubscription> {
    const { data, error } = await this.supabase
      .from('subscription')
      .update({
        tier: 'free',
        mp_payment_status: 'expired',
        ...FREE_LIMITS,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`Failed to downgrade user ${userId}: ${error?.message}`)
    }

    return data as PaymentSubscription
  }

  async updatePaymentStatus(
    userId: string,
    status: PaymentSubscription['mp_payment_status']
  ): Promise<void> {
    const { error } = await this.supabase
      .from('subscription')
      .update({
        mp_payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update payment status for ${userId}: ${error.message}`)
    }
  }

  async setPaymentPending(
    userId: string,
    input: {
      payment_method: 'pix' | 'credit_card'
      mp_payment_id?: string
      mp_preapproval_id?: string
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('subscription')
      .update({
        payment_method: input.payment_method,
        mp_payment_id: input.mp_payment_id ?? null,
        mp_preapproval_id: input.mp_preapproval_id ?? null,
        mp_payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to set payment pending for ${userId}: ${error.message}`)
    }
  }

  async getByMpPaymentId(mpPaymentId: string): Promise<PaymentSubscription | null> {
    const { data, error } = await this.supabase
      .from('subscription')
      .select('*')
      .eq('mp_payment_id', mpPaymentId)
      .single()

    if (error || !data) return null

    return data as PaymentSubscription
  }

  async logPaymentEvent(input: PaymentLogInput): Promise<void> {
    const { error } = await this.supabase.from('payment_log').insert({
      user_id: input.user_id,
      mp_payment_id: input.mp_payment_id ?? null,
      mp_preapproval_id: input.mp_preapproval_id ?? null,
      event_type: input.event_type,
      amount_cents: input.amount_cents ?? null,
      raw_payload: input.raw_payload,
    })

    if (error) {
      console.error('[PaymentLog] Failed to log event:', error.message)
    }
  }
}
