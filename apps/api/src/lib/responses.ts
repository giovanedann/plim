import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  HttpStatus,
  PaginationMeta,
} from '@plim/shared'
import type { Context } from 'hono'

/**
 * Returns a success response with data wrapped in { data: T }
 *
 * @param c - Hono context
 * @param data - Response data of any type
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with type-safe success structure
 *
 * @example
 * return success(c, expense, HTTP_STATUS.OK)
 * // => { data: { id: '123', amount: 100, ... } }
 *
 * @example
 * return success(c, expenses, HTTP_STATUS.OK)
 * // => { data: [{ id: '1', ... }, { id: '2', ... }] }
 */
export function success<T>(c: Context, data: T, status: HttpStatus = 200) {
  // @ts-expect-error - Hono's c.json status type is overly restrictive
  return c.json<ApiSuccessResponse<T>>({ data }, status)
}

/**
 * Returns a paginated response with { data: T[], meta: PaginationMeta }
 *
 * @param c - Hono context
 * @param data - Array of items
 * @param meta - Pagination metadata (page, limit, total, totalPages)
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with type-safe paginated structure
 *
 * @example
 * return paginated(c, expenses, {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 *   totalPages: 5
 * })
 * // => { data: [...], meta: { page: 1, limit: 20, total: 100, totalPages: 5 } }
 */
export function paginated<T>(
  c: Context,
  data: T[],
  meta: PaginationMeta,
  status: HttpStatus = 200
) {
  // @ts-expect-error - Hono's c.json status type is overly restrictive
  return c.json<ApiPaginatedResponse<T>>({ data, meta }, status)
}

/**
 * Returns an error response matching the existing middleware format
 *
 * @param c - Hono context
 * @param code - Machine-readable error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error context
 * @returns JSON response with type-safe error structure
 *
 * @example
 * return error(c, ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
 * // => { error: { code: 'NOT_FOUND', message: 'Expense not found' } }
 *
 * @example
 * return error(c, ERROR_CODES.VALIDATION_ERROR, 'Invalid data', HTTP_STATUS.BAD_REQUEST, zodError.flatten())
 * // => { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: {...} } }
 */
export function error(
  c: Context,
  code: string,
  message: string,
  status: HttpStatus = 400,
  details?: unknown
) {
  // @ts-expect-error - Hono's c.json status type is overly restrictive
  return c.json<ApiErrorResponse>({ error: { code, message, details } }, status)
}
