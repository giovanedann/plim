import { z } from 'zod'
import { type PaginationMeta, paginationMetaSchema } from '../schemas/expense'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Standard success response wrapper
 * @example { data: { id: '123', name: 'Expense' } }
 */
export interface ApiSuccessResponse<T> {
  data: T
}

/**
 * Paginated response with flat structure (metadata at top level)
 * @example { data: [...], meta: { page: 1, limit: 20, total: 100, totalPages: 5 } }
 */
export interface ApiPaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Error response matching existing middleware format
 * @example { error: { code: 'NOT_FOUND', message: 'Resource not found' } }
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

// Re-export PaginationMeta for convenience
export type { PaginationMeta }

// ============================================================================
// Zod Schemas (Runtime Validation)
// ============================================================================

/**
 * Generic success response schema factory
 * @example apiSuccessResponseSchema(expenseSchema)
 */
export const apiSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  })

/**
 * Generic paginated response schema factory
 * @example apiPaginatedResponseSchema(expenseSchema)
 */
export const apiPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
  })

/**
 * Error response schema
 */
export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
