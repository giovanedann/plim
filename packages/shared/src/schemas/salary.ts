import { z } from 'zod'

export const salaryHistorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative(),
  effective_from: z.string().date(),
  created_at: z.string().datetime(),
})

export const createSalarySchema = salaryHistorySchema.pick({
  amount_cents: true,
  effective_from: true,
})

export const salaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
})

export type SalaryHistory = z.infer<typeof salaryHistorySchema>
export type CreateSalary = z.infer<typeof createSalarySchema>
export type SalaryQuery = z.infer<typeof salaryQuerySchema>
