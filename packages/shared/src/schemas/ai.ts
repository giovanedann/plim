import { z } from 'zod'

// Content part types for multimodal input
export const textContentPartSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1),
})

export const imageContentPartSchema = z.object({
  type: z.literal('image'),
  data: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
})

export const audioContentPartSchema = z.object({
  type: z.literal('audio'),
  data: z.string().min(1),
  mimeType: z.enum(['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg']),
})

export const contentPartSchema = z.discriminatedUnion('type', [
  textContentPartSchema,
  imageContentPartSchema,
  audioContentPartSchema,
])

// Chat message schema
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.array(contentPartSchema).min(1),
})

// AI Chat Request schema
export const aiChatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
})

// Type usage schema (per request type)
export const typeUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
})

// AI Usage Response schema (with tiered limits)
export const aiUsageResponseSchema = z.object({
  tier: z.enum(['free', 'pro', 'unlimited']),
  text: typeUsageSchema,
  voice: typeUsageSchema,
  image: typeUsageSchema,
  // Legacy fields for backwards compatibility
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  remainingRequests: z.number().int().nonnegative(),
})

// AI Chat Response schema
export const aiChatResponseSchema = z.object({
  message: z.string(),
  action: z
    .object({
      type: z.enum(['expense_created', 'query_result', 'forecast_result', 'show_tutorial', 'help']),
      data: z.unknown().optional(),
    })
    .optional(),
  usageInfo: aiUsageResponseSchema,
})

// Function parameter schemas for Gemini function calling

// Create expense/income function parameters
export const createExpenseFunctionParamsSchema = z.object({
  description: z.string().min(1).max(255),
  amount_cents: z.number().int().positive(),
  category_name: z.string().min(1).optional(),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']),
  date: z.string(),
  credit_card_name: z.string().optional(),
  installment_total: z.number().int().min(2).max(48).optional(),
  is_recurrent: z.boolean().optional(),
  recurrence_day: z.number().int().min(1).max(31).optional(),
  transaction_type: z.enum(['expense', 'income']).default('expense'),
})

// Query expenses function parameters
export const queryExpensesFunctionParamsSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  category_name: z.string().optional(),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']).optional(),
  credit_card_name: z.string().optional(),
  group_by: z.enum(['category', 'payment_method', 'day', 'month']).optional(),
})

// Forecast spending function parameters
export const forecastSpendingFunctionParamsSchema = z.object({
  months_ahead: z.number().int().min(1).max(12).default(3),
  include_recurrent: z.boolean().default(true),
  include_installments: z.boolean().default(true),
})

// Execute query function parameters (raw SQL execution)
export const executeQueryFunctionParamsSchema = z.object({
  sql: z.string().min(1),
  description: z.string().min(1),
})

// Type exports
export type TextContentPart = z.infer<typeof textContentPartSchema>
export type ImageContentPart = z.infer<typeof imageContentPartSchema>
export type AudioContentPart = z.infer<typeof audioContentPartSchema>
export type ContentPart = z.infer<typeof contentPartSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type AIChatRequest = z.infer<typeof aiChatRequestSchema>
export type AIChatResponse = z.infer<typeof aiChatResponseSchema>
export type TypeUsage = z.infer<typeof typeUsageSchema>
export type AIUsageResponse = z.infer<typeof aiUsageResponseSchema>
export type CreateExpenseFunctionParams = z.infer<typeof createExpenseFunctionParamsSchema>
export type QueryExpensesFunctionParams = z.infer<typeof queryExpensesFunctionParamsSchema>
export type ForecastSpendingFunctionParams = z.infer<typeof forecastSpendingFunctionParamsSchema>
export type ExecuteQueryFunctionParams = z.infer<typeof executeQueryFunctionParamsSchema>
