import { useAuthStore } from '@/stores/auth.store'
import type { ApiErrorResponse, ApiPaginatedResponse, ApiSuccessResponse } from '@plim/shared'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// Non-paginated response type (most endpoints)
// Separating this from paginated responses ensures TypeScript knows `data` is exactly T
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Paginated response type (explicit, used by getPaginated)
export type ApiPaginatedResponseOrError<T> = ApiPaginatedResponse<T> | ApiErrorResponse

// Type guard for error responses - works with both response types
export function isErrorResponse<T>(
  response: ApiSuccessResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse
): response is ApiErrorResponse {
  return 'error' in response
}

// Type guard for paginated responses
export function isPaginatedResponse<T>(
  response: ApiPaginatedResponse<T> | ApiErrorResponse
): response is ApiPaginatedResponse<T> {
  return 'meta' in response && 'data' in response
}

// Type guard for success responses
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return 'data' in response && !('error' in response)
}

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = await getAuthToken()

  if (!token) {
    return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  }

  const url = `${API_URL}/api/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Handle 401 Unauthorized - clear auth state and sign out
    if (response.status === 401) {
      useAuthStore.getState().setSession(null)
      await supabase.auth.signOut()
    }

    const errorData = await response.json().catch(() => ({}))
    return {
      error: errorData.error || {
        code: 'REQUEST_FAILED',
        message: `Request failed with status ${response.status}`,
      },
    }
  }

  // Handle 204 No Content - return empty success response
  // For void operations (delete), T is void so null satisfies the contract
  if (response.status === 204) {
    return { data: null as unknown as T }
  }

  // Return backend response as-is - it already matches our shared types
  return (await response.json()) as ApiResponse<T>
}

async function requestPaginated<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiPaginatedResponseOrError<T>> {
  const token = await getAuthToken()

  if (!token) {
    return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
  }

  const url = `${API_URL}/api/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().setSession(null)
      await supabase.auth.signOut()
    }

    const errorData = await response.json().catch(() => ({}))
    return {
      error: errorData.error || {
        code: 'REQUEST_FAILED',
        message: `Request failed with status ${response.status}`,
      },
    }
  }

  return (await response.json()) as ApiPaginatedResponse<T>
}

export const api = {
  get: <T>(endpoint: string): Promise<ApiResponse<T>> => request<T>(endpoint, { method: 'GET' }),

  getPaginated: <T>(endpoint: string): Promise<ApiPaginatedResponseOrError<T>> =>
    requestPaginated<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string): Promise<ApiResponse<T>> =>
    request<T>(endpoint, { method: 'DELETE' }),
}
