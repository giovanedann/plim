import { z } from 'zod'

export const paymentMethodSchema = z.enum(['credit_card', 'debit_card', 'pix', 'cash'])

export const expenseSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  category_id: z.uuid(),
  description: z.string().min(1).max(255),
  amount_cents: z.number().int().positive(),
  payment_method: paymentMethodSchema,
  date: z.iso.date(),
  is_recurrent: z.boolean().default(false),
  recurrence_day: z.number().int().min(1).max(31).nullable(),
  recurrence_start: z.iso.date().nullable(),
  recurrence_end: z.iso.date().nullable(),
  installment_current: z.number().int().min(1).nullable(),
  installment_total: z.number().int().min(1).nullable(),
  installment_group_id: z.uuid().nullable(),
  credit_card_id: z.uuid().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  is_projected: z.boolean().optional(),
  source_expense_id: z.uuid().optional(),
})

export const createExpenseSchema = z.discriminatedUnion('type', [
  // One-time expense
  z.object({
    type: z.literal('one_time'),
    category_id: z.uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    date: z.iso.date(),
    credit_card_id: z.uuid().optional(),
  }),
  // Recurrent expense
  z.object({
    type: z.literal('recurrent'),
    category_id: z.uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    recurrence_day: z.number().int().min(1).max(31),
    recurrence_start: z.iso.date(),
    recurrence_end: z.iso.date().optional(),
    credit_card_id: z.uuid().optional(),
  }),
  // Installment expense
  z.object({
    type: z.literal('installment'),
    category_id: z.uuid(),
    description: z.string().min(1).max(255),
    amount_cents: z.number().int().positive(),
    payment_method: paymentMethodSchema,
    date: z.iso.date(),
    installment_total: z.number().int().min(2).max(48),
    credit_card_id: z.uuid().optional(),
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
    credit_card_id: true,
  })
  .partial()

export const expenseTypeSchema = z.enum(['one_time', 'recurrent', 'installment'])

export const expenseFiltersSchema = z.object({
  start_date: z.iso.date().optional(),
  end_date: z.iso.date().optional(),
  category_id: z.uuid().optional(),
  payment_method: paymentMethodSchema.optional(),
  expense_type: expenseTypeSchema.optional(),
  credit_card_id: z.union([z.uuid(), z.literal('none')]).optional(),
})

export const paginatedExpenseFiltersSchema = expenseFiltersSchema.extend({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(10).max(100).default(20),
})

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const paginatedExpensesSchema = z.object({
  data: z.array(expenseSchema),
  meta: paginationMetaSchema,
})

export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type ExpenseType = z.infer<typeof expenseTypeSchema>
export type Expense = z.infer<typeof expenseSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type UpdateExpense = z.infer<typeof updateExpenseSchema>
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>
export type PaginatedExpenseFilters = z.infer<typeof paginatedExpenseFiltersSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>
export type PaginatedExpenses = z.infer<typeof paginatedExpensesSchema>
