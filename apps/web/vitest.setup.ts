import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    // Enable reduced motion in tests to skip animations
    matches: query === '(prefers-reduced-motion: reduce)',
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

// Mock IntersectionObserver (used by Framer Motion)
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver

// Mock Zustand using official testing pattern
// This allows stores to be reset between tests for proper isolation
vi.mock('zustand')

// Cleanup after each test
afterEach(async () => {
  cleanup()

  // Reset all Zustand stores to initial state
  const { storeResetFns } = await import('./__mocks__/zustand')
  for (const resetFn of storeResetFns) {
    resetFn()
  }
})
