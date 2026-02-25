import { z } from 'zod'

export const paymentMethodSchema = z.enum(['credit_card', 'debit_card', 'pix', 'cash'], {
  message: 'Selecione um método de pagamento válido',
})

export const incomePaymentMethodSchema = z.enum(['pix', 'cash'], {
  message: 'Selecione um método de recebimento válido',
})

export const transactionTypeSchema = z.enum(['expense', 'income'], {
  message: 'Selecione um tipo de transação válido',
})

export const expenseSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  type: transactionTypeSchema.default('expense'),
  category_id: z.uuid().nullable(),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
  payment_method: paymentMethodSchema,
  date: z.iso.date(),
  is_recurrent: z.boolean().default(false),
  recurrence_day: z.number().int().min(1).max(31).nullable(),
  recurrence_start: z.iso.date().nullable(),
  recurrence_end: z.iso.date().nullable(),
  installment_current: z.number().int().min(1).nullable(),
  installment_total: z.number().int().min(1).nullable(),
  installment_group_id: z.uuid().nullable(),
  recurrent_group_id: z.uuid().nullable(),
  credit_card_id: z.uuid().nullable(),
  invoice_id: z.uuid().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  is_projected: z.boolean().optional(),
  source_expense_id: z.uuid().optional(),
})

export const createExpenseSchema = z.discriminatedUnion('type', [
  // One-time expense
  z.object({
    type: z.literal('one_time'),
    category_id: z.uuid({ message: 'Selecione uma categoria' }),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    payment_method: paymentMethodSchema,
    date: z.iso.date({ message: 'Selecione uma data válida' }),
    credit_card_id: z.uuid().optional(),
  }),
  // Recurrent expense
  z.object({
    type: z.literal('recurrent'),
    category_id: z.uuid({ message: 'Selecione uma categoria' }),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    payment_method: paymentMethodSchema,
    recurrence_day: z
      .number()
      .int()
      .min(1, 'Dia deve ser entre 1 e 31')
      .max(31, 'Dia deve ser entre 1 e 31'),
    recurrence_start: z.iso.date({ message: 'Selecione a data de início' }),
    recurrence_end: z.iso.date().optional(),
    credit_card_id: z.uuid().optional(),
  }),
  // Installment expense
  z.object({
    type: z.literal('installment'),
    category_id: z.uuid({ message: 'Selecione uma categoria' }),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    payment_method: paymentMethodSchema,
    date: z.iso.date({ message: 'Selecione uma data válida' }),
    installment_total: z
      .number()
      .int()
      .min(2, 'Número de parcelas deve ser entre 2 e 48')
      .max(48, 'Número de parcelas deve ser entre 2 e 48'),
    credit_card_id: z.uuid().optional(),
  }),
  // Income (one-time)
  z.object({
    type: z.literal('income'),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    date: z.iso.date({ message: 'Selecione uma data válida' }),
    payment_method: incomePaymentMethodSchema,
  }),
  // Income (recurrent)
  z.object({
    type: z.literal('income_recurrent'),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    payment_method: incomePaymentMethodSchema,
    recurrence_day: z
      .number()
      .int()
      .min(1, 'Dia deve ser entre 1 e 31')
      .max(31, 'Dia deve ser entre 1 e 31'),
    recurrence_start: z.iso.date({ message: 'Selecione a data de início' }),
    recurrence_end: z.iso.date().optional(),
  }),
  // Income (installment)
  z.object({
    type: z.literal('income_installment'),
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
    payment_method: incomePaymentMethodSchema,
    date: z.iso.date({ message: 'Selecione uma data válida' }),
    installment_total: z
      .number()
      .int()
      .min(2, 'Número de parcelas deve ser entre 2 e 48')
      .max(48, 'Número de parcelas deve ser entre 2 e 48'),
  }),
])

export const createIncomeSchema = z.object({
  type: z.literal('income'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
  date: z.iso.date({ message: 'Selecione uma data válida' }),
  payment_method: incomePaymentMethodSchema,
})

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

export const expenseTypeSchema = z.enum(['one_time', 'recurrent', 'installment'], {
  message: 'Selecione um tipo de despesa válido',
})

export const expenseFiltersSchema = z.object({
  start_date: z.iso.date().optional(),
  end_date: z.iso.date().optional(),
  category_id: z.uuid().optional(),
  payment_method: paymentMethodSchema.optional(),
  expense_type: expenseTypeSchema.optional(),
  credit_card_id: z.union([z.uuid(), z.literal('none')]).optional(),
  transaction_type: transactionTypeSchema.optional(),
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
export type IncomePaymentMethod = z.infer<typeof incomePaymentMethodSchema>
export type TransactionType = z.infer<typeof transactionTypeSchema>
export type ExpenseType = z.infer<typeof expenseTypeSchema>
export type Expense = z.infer<typeof expenseSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type CreateIncome = z.infer<typeof createIncomeSchema>
export type UpdateExpense = z.infer<typeof updateExpenseSchema>
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>
export type PaginatedExpenseFilters = z.infer<typeof paginatedExpenseFiltersSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>
export type PaginatedExpenses = z.infer<typeof paginatedExpensesSchema>
