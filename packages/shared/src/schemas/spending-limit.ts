import { z } from 'zod'

export const spendingLimitSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  year_month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato AAAA-MM'),
  amount_cents: z.number().int().positive(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const upsertSpendingLimitSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato AAAA-MM'),
  amount_cents: z.number().int().positive(),
})

export const effectiveSpendingLimitSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato AAAA-MM'),
  amount_cents: z.number().int().positive(),
  is_carried_over: z.boolean(),
  source_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable(),
})

export type SpendingLimit = z.infer<typeof spendingLimitSchema>
export type UpsertSpendingLimit = z.infer<typeof upsertSpendingLimitSchema>
export type EffectiveSpendingLimit = z.infer<typeof effectiveSpendingLimitSchema>
