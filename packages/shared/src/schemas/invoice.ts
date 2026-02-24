import { z } from 'zod'

export const invoiceStatusSchema = z.enum(['open', 'partially_paid', 'paid'])

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  credit_card_id: z.string().uuid(),
  reference_month: z.string(),
  cycle_start: z.string(),
  cycle_end: z.string(),
  total_amount_cents: z.number().int(),
  paid_amount_cents: z.number().int(),
  carry_over_cents: z.number().int(),
  status: invoiceStatusSchema,
  paid_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createInvoiceSchema = z.object({
  credit_card_id: z.string().uuid(),
  reference_month: z.string(),
  cycle_start: z.string(),
  cycle_end: z.string(),
  total_amount_cents: z.number().int(),
  paid_amount_cents: z.number().int().default(0),
  carry_over_cents: z.number().int().default(0),
  status: invoiceStatusSchema.default('open'),
})

export const updateInvoiceSchema = createInvoiceSchema
  .partial()
  .extend({ paid_at: z.string().datetime().nullable().optional() })

export const payInvoiceSchema = z.object({
  amount_cents: z.number().int().min(1),
})

export const creditCardLimitUsageSchema = z.object({
  credit_card_id: z.string().uuid(),
  credit_limit_cents: z.number().int(),
  used_cents: z.number().int(),
  available_cents: z.number().int(),
})

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>
export type Invoice = z.infer<typeof invoiceSchema>
export type CreateInvoice = z.infer<typeof createInvoiceSchema>
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>
export type PayInvoice = z.infer<typeof payInvoiceSchema>
export type CreditCardLimitUsage = z.infer<typeof creditCardLimitUsageSchema>
