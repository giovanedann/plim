import { z } from 'zod'

export const cardFlagSchema = z.enum([
  'visa',
  'mastercard',
  'elo',
  'american_express',
  'hipercard',
  'diners',
  'other',
])

export const cardBankSchema = z.enum([
  'nubank',
  'inter',
  'c6_bank',
  'itau',
  'bradesco',
  'santander',
  'banco_do_brasil',
  'caixa',
  'original',
  'neon',
  'next',
  'picpay',
  'mercado_pago',
  'other',
])

export const cardColorSchema = z.enum([
  'black',
  'dark_blue',
  'yellow',
  'red',
  'orange',
  'light_purple',
  'neon_green',
  'neon_blue',
  'white',
  'silver',
  'gold',
  'rose_gold',
])

export const creditCardSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: cardColorSchema,
  flag: cardFlagSchema,
  bank: cardBankSchema,
  last_4_digits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createCreditCardSchema = z.object({
  name: z.string().min(1).max(50),
  color: cardColorSchema,
  flag: cardFlagSchema,
  bank: cardBankSchema,
  last_4_digits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional(),
})

export const updateCreditCardSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: cardColorSchema.optional(),
  flag: cardFlagSchema.optional(),
  bank: cardBankSchema.optional(),
  last_4_digits: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
})

export type CardFlag = z.infer<typeof cardFlagSchema>
export type CardBank = z.infer<typeof cardBankSchema>
export type CardColor = z.infer<typeof cardColorSchema>
export type CreditCard = z.infer<typeof creditCardSchema>
export type CreateCreditCard = z.infer<typeof createCreditCardSchema>
export type UpdateCreditCard = z.infer<typeof updateCreditCardSchema>
