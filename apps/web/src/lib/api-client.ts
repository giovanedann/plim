import { useAuthStore } from '@/stores/auth.store'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// Client wrapper for API responses - provides consistent interface for frontend
// Backend returns: { data: T } or { data: T[], meta: ... } or { error: {...} }
// We wrap this to provide optional error handling
export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
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

  // Handle 204 No Content
  if (response.status === 204) {
    return { data: undefined as T }
  }

  const json = await response.json()

  // Backend returns: { data: T } for success, { data: T[], meta: PaginationMeta } for paginated
  // We wrap success responses to maintain consistent API, but preserve paginated structure
  if (json.meta !== undefined) {
    // Paginated response: wrap the entire structure
    return { data: json }
  }

  // Regular success response: data is already at top level
  return { data: json.data }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}
