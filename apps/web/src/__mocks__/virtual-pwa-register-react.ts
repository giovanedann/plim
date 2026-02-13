import { vi } from 'vitest'

export function useRegisterSW(_options?: {
  onRegisteredSW?: (swUrl: string, registration: unknown) => void
}): {
  needRefresh: [boolean, (value: boolean) => void]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
} {
  return {
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }
}
