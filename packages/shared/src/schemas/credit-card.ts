import { z } from 'zod'

export const cardFlagSchema = z.enum(
  ['visa', 'mastercard', 'elo', 'american_express', 'hipercard', 'diners', 'other'],
  {
    message: 'Selecione uma bandeira válida',
  }
)

export const cardBankSchema = z.enum(
  [
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
  ],
  {
    message: 'Selecione um banco válido',
  }
)

export const cardColorSchema = z.enum(
  [
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
  ],
  {
    message: 'Selecione uma cor válida',
  }
)

export const creditCardSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  color: cardColorSchema,
  flag: cardFlagSchema,
  bank: cardBankSchema,
  last_4_digits: z
    .string()
    .length(4, 'Deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'Deve conter apenas números')
    .nullable(),
  expiration_day: z.number().int().min(1).max(31).nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  color: cardColorSchema,
  flag: cardFlagSchema,
  bank: cardBankSchema,
  last_4_digits: z
    .string()
    .length(4, 'Deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'Deve conter apenas números')
    .optional(),
  expiration_day: z.number().int().min(1).max(31).optional(),
})

export const updateCreditCardSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .optional(),
  color: cardColorSchema.optional(),
  flag: cardFlagSchema.optional(),
  bank: cardBankSchema.optional(),
  last_4_digits: z
    .string()
    .length(4, 'Deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'Deve conter apenas números')
    .nullable()
    .optional(),
  expiration_day: z.number().int().min(1).max(31).nullable().optional(),
  is_active: z.boolean().optional(),
})

export type CardFlag = z.infer<typeof cardFlagSchema>
export type CardBank = z.infer<typeof cardBankSchema>
export type CardColor = z.infer<typeof cardColorSchema>
export type CreditCard = z.infer<typeof creditCardSchema>
export type CreateCreditCard = z.infer<typeof createCreditCardSchema>
export type UpdateCreditCard = z.infer<typeof updateCreditCardSchema>
