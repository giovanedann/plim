import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  PaginationMeta,
} from '../http/responses'

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return { data }
}

export function createPaginatedResponse<T>(
  data: T[],
  meta: Partial<PaginationMeta> = {}
): ApiPaginatedResponse<T> {
  return {
    data,
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 20,
      total: meta.total ?? data.length,
      totalPages: meta.totalPages ?? Math.ceil((meta.total ?? data.length) / (meta.limit ?? 20)),
    },
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  }
}

export const ERROR_RESPONSES = {
  NOT_FOUND: createErrorResponse('NOT_FOUND', 'Resource not found'),
  UNAUTHORIZED: createErrorResponse('UNAUTHORIZED', 'Authentication required'),
  FORBIDDEN: createErrorResponse('FORBIDDEN', 'Access denied'),
  VALIDATION_ERROR: (details?: unknown) =>
    createErrorResponse('VALIDATION_ERROR', 'Validation failed', details),
  INTERNAL_ERROR: createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
} as const
