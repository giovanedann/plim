import { ThemeProvider } from '@/components/theme-provider'
import type { User } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import { routeTree } from '../routeTree.gen'

// Re-export shared test utilities
export {
  createMockExpense,
  createMockCategory,
  createMockCreditCard,
  createMockProfile,
  createMockSalaryHistory,
  resetIdCounter,
} from '@plim/shared'

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_USER: User = {
  id: 'user-00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
} as User

// ============================================================================
// Integration Wrapper (for non-routed components)
// ============================================================================

/**
 * Creates a wrapper component with QueryClient and ThemeProvider for testing components
 * that don't need routing.
 *
 * @example
 * const wrapper = createIntegrationWrapper()
 * render(<ExpenseForm />, { wrapper })
 */
export function createIntegrationWrapper() {
  // Create a fresh QueryClient for each test to prevent cross-test contamination
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return function IntegrationWrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    )
  }
}

// ============================================================================
// Router Integration Helpers
// ============================================================================

interface RouterIntegrationOptions {
  initialRoute?: string
  user?: User | null
  isInitialized?: boolean
  isInRecoveryMode?: boolean
}

/**
 * Creates a test router for integration testing with routing.
 * Use this for testing pages and components that depend on routing context.
 *
 * Returns both the router and a wrapper component that includes QueryClientProvider.
 *
 * @example
 * const { router, wrapper } = createTestRouter({ initialRoute: '/expenses' })
 * render(<RouterProvider router={router} />, { wrapper })
 */
export function createTestRouter(options: RouterIntegrationOptions = {}) {
  const {
    initialRoute = '/',
    user = TEST_USER,
    isInitialized = true,
    isInRecoveryMode = false,
  } = options

  const memoryHistory = createMemoryHistory({ initialEntries: [initialRoute] })

  const router = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      auth: {
        user,
        isInitialized,
        isInRecoveryMode,
      },
    },
  })

  // Create a fresh QueryClient for each test
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  function RouterTestWrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    )
  }

  return { router, wrapper: RouterTestWrapper }
}

// ============================================================================
// API Mock Helpers
// ============================================================================

/**
 * Creates a mock API response for successful requests.
 */
export function createMockApiResponse<T>(data: T) {
  return { data }
}

/**
 * Creates a mock API error response.
 */
export function createMockApiError(code: string, message: string) {
  return { error: { code, message } }
}

/**
 * Creates a mock API paginated response.
 */
export function createMockApiPaginatedResponse<T>(
  data: T[],
  options: { page?: number; limit?: number; total?: number } = {}
) {
  const { page = 1, limit = 10, total = data.length } = options

  return {
    data,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  }
}

// Store for accumulated API mocks
const apiMockStore = new Map<string, { response: unknown; status: number; method: string }>()

/**
 * Mocks global fetch for API requests.
 * Use this helper to mock API responses in integration tests.
 *
 * @example
 * mockApiResponse('/expenses', createMockApiResponse([expense]))
 * mockApiResponse('/expenses/123', createMockApiError('NOT_FOUND', 'Expense not found'), 404)
 */
export function mockApiResponse(endpoint: string, response: unknown, status = 200, method = 'GET') {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
  const targetUrl = `${apiUrl}/api/v1${endpoint}`
  const key = `${method}:${targetUrl}`

  // Add this mock to the store
  apiMockStore.set(key, { response, status, method })

  // Create/update the global fetch mock with all accumulated mocks
  const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const requestMethod = options?.method || 'GET'
    const requestKey = `${requestMethod}:${url}`

    console.log(`[FETCH] ${requestMethod} ${url}`)
    console.log('[FETCH] Available mocks:', Array.from(apiMockStore.keys()))

    const mock = apiMockStore.get(requestKey)
    if (mock) {
      console.log(`[FETCH] ✓ Matched mock for ${requestKey}`)
      return Promise.resolve({
        ok: mock.status >= 200 && mock.status < 300,
        status: mock.status,
        json: () => Promise.resolve(mock.response),
      })
    }

    console.warn(`[FETCH] ✗ Unhandled request: ${requestMethod} ${url}`)
    return Promise.reject(new Error(`Unhandled request: ${requestMethod} ${url}`))
  })

  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

/**
 * Resets all API mocks.
 */
export function resetApiMocks() {
  apiMockStore.clear()
  vi.restoreAllMocks()
}
