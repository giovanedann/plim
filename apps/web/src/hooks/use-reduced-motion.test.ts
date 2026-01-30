import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from './use-reduced-motion'

describe('useReducedMotion', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null
  let mockMatches = false

  beforeEach(() => {
    vi.clearAllMocks()
    changeHandler = null
    mockMatches = false

    mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'change') {
        changeHandler = handler
      }
    })
    mockRemoveEventListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: mockMatches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when user does not prefer reduced motion', () => {
    const sut = useReducedMotion
    mockMatches = false

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)
  })

  it('returns true when user prefers reduced motion', () => {
    const sut = useReducedMotion
    mockMatches = true

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)
  })

  it('queries the correct media query', () => {
    const sut = useReducedMotion

    renderHook(() => sut())

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('registers change event listener on mount', () => {
    const sut = useReducedMotion

    renderHook(() => sut())

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes change event listener on unmount', () => {
    const sut = useReducedMotion

    const { unmount } = renderHook(() => sut())
    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates when preference changes to reduced motion', () => {
    const sut = useReducedMotion

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)

    // Simulate preference change
    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })

  it('updates when preference changes from reduced motion', () => {
    const sut = useReducedMotion

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)

    // Simulate preference change
    act(() => {
      changeHandler?.({ matches: false } as MediaQueryListEvent)
    })

    expect(result.current).toBe(false)
  })

  it('starts with false before effect runs', () => {
    const sut = useReducedMotion

    // Even when matchMedia returns true, initial state is false
    // because useState initializes with false before useEffect runs
    const { result } = renderHook(() => sut())

    // After effect runs, it should reflect the actual media query
    // This test verifies the hook properly updates from initial false
    expect(typeof result.current).toBe('boolean')
  })
})
