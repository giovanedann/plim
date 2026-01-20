import { z } from 'zod'

export const paymentMethodSchema = z.enum(['credit_card', 'debit_card', 'pix', 'cash'])

export const expenseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount_cents: z.number().int().positive(),
  payment_method: paymentMethodSchema,
  date: z.string().date(),
  is_recurrent: z.boolean().default(false),
  recurrence_day: z.number().int().min(1).max(31).nullable(),
  recurrence_start: z.string().date().nullable(),
  recurrence_end: z.string().date().nullable(),
  installment_current: z.number().int().min(1).nullable(),
  installment_total: z.number().int().min(1).nullable(),
  installment_group_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  is_projected: z.boolean().optional(),
  source_expense_id: z.string().uuid().optional(),
})

export const createExpenseSchema = z.discriminatedUnion('type', [
  // One-time expense
  z.object({
    type: z.literal('one_time'),
    category_id: z.string().uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    date: z.string().date(),
  }),
  // Recurrent expense
  z.object({
    type: z.literal('recurrent'),
    category_id: z.string().uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    recurrence_day: z.number().int().min(1).max(31),
    recurrence_start: z.string().date(),
    recurrence_end: z.string().date().optional(),
  }),
  // Installment expense
  z.object({
    type: z.literal('installment'),
    category_id: z.string().uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    date: z.string().date(),
    installment_total: z.number().int().min(2).max(48),
  }),
])

export const updateExpenseSchema = expenseSchema
  .pick({
    category_id: true,
    description: true,
    amount_cents: true,
    payment_method: true,
    date: true,
    recurrence_end: true,
  })
  .partial()

export const expenseFiltersSchema = z.object({
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  category_id: z.string().uuid().optional(),
  payment_method: paymentMethodSchema.optional(),
})

export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type Expense = z.infer<typeof expenseSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type UpdateExpense = z.infer<typeof updateExpenseSchema>
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>
