import { Hono } from 'hono'
import { vi } from 'vitest'
import { errorHandler } from '../middleware/error-handler.middleware'
import type { Env } from '../types'

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

export const TEST_USER_ID = 'user-00000000-0000-0000-0000-000000000001'
export const TEST_ACCESS_TOKEN = 'test-access-token'

export const TEST_ENV = {
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_ACCOUNT_DELETE_SECRET_KEY: 'test-secret-key',
  AVATARS_BUCKET: {} as R2Bucket,
  R2_PUBLIC_URL: 'https://test-r2.example.com',
  ENVIRONMENT: 'development' as const,
  UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
}

// ============================================================================
// Mock Supabase Types
// ============================================================================

type MockSupabaseQuery = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  not: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
  auth: { getUser: ReturnType<typeof vi.fn> }
  storage: { from: ReturnType<typeof vi.fn> }
  rpc: ReturnType<typeof vi.fn>
}

// ============================================================================
// Mock Supabase Factory
// ============================================================================

/**
 * Creates a chainable mock query that simulates Supabase query builder.
 */
export function createMockSupabaseQuery(): MockSupabaseQuery {
  const query: MockSupabaseQuery = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
  }

  // Make all methods chainable
  for (const key of Object.keys(query) as (keyof MockSupabaseQuery)[]) {
    query[key].mockReturnValue(query)
  }

  return query
}

/**
 * Creates a mock Supabase client for integration testing.
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const mockQuery = createMockSupabaseQuery()

  return {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: TEST_USER_ID } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

// ============================================================================
// Integration App Factory
// ============================================================================

/**
 * Creates a Hono app configured for integration testing.
 * Includes error handler and mock auth middleware.
 */
export function createIntegrationApp(userId = TEST_USER_ID): Hono<Env> {
  const app = new Hono<Env>()

  app.onError(errorHandler)

  app.use('*', async (c, next) => {
    c.set('userId', userId)
    c.set('accessToken', TEST_ACCESS_TOKEN)
    await next()
  })

  return app
}
