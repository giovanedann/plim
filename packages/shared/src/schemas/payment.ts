import { z } from 'zod'

export const pixPaymentResponseSchema = z.object({
  qr_code_base64: z.string(),
  pix_copia_cola: z.string(),
  mp_payment_id: z.string(),
  expires_at: z.string(),
})

export const subscriptionStatusResponseSchema = z.object({
  tier: z.enum(['free', 'pro', 'unlimited']),
  payment_method: z.enum(['pix', 'credit_card']).nullable(),
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  mp_payment_status: z.enum(['pending', 'approved', 'cancelled', 'expired']).nullable(),
  is_expiring_soon: z.boolean(),
  days_remaining: z.number().int().nullable(),
})

export type PixPaymentResponse = z.infer<typeof pixPaymentResponseSchema>
export type SubscriptionStatusResponse = z.infer<typeof subscriptionStatusResponseSchema>
