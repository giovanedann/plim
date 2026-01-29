import { z } from 'zod'

export const salaryHistorySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  amount_cents: z.number().int().nonnegative('Valor não pode ser negativo'),
  effective_from: z.iso.date(),
  created_at: z.iso.datetime(),
})

export const createSalarySchema = salaryHistorySchema.pick({
  amount_cents: true,
  effective_from: true,
})

export const salaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato AAAA-MM'),
})

export type SalaryHistory = z.infer<typeof salaryHistorySchema>
export type CreateSalary = z.infer<typeof createSalarySchema>
export type SalaryQuery = z.infer<typeof salaryQuerySchema>
