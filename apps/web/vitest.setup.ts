import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock ResizeObserver (used by Recharts)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token-123',
            user: {
              id: 'user-00000000-0000-0000-0000-000000000001',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

// Mock Zustand using official testing pattern
// This allows stores to be reset between tests for proper isolation
vi.mock('zustand')

// Cleanup after each test
afterEach(async () => {
  cleanup()

  // Reset all Zustand stores to initial state
  const { storeResetFns } = await import('./__mocks__/zustand')
  storeResetFns.forEach((resetFn) => {
    resetFn()
  })
})
