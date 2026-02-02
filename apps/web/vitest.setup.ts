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

// Mock Auth Store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      user: {
        id: 'user-00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
      },
      isInitialized: true,
      isInRecoveryMode: false,
      setSession: vi.fn(),
      initialize: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Mock UI Store
vi.mock('@/stores/ui.store', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      sidebarOpen: true,
      hideValues: false,
      toggleSidebar: vi.fn(),
      setSidebarOpen: vi.fn(),
      toggleHideValues: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})
