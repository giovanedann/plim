import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>
  let changeHandler: (() => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    changeHandler = null

    mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'change') {
        changeHandler = handler
      }
    })
    mockRemoveEventListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
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

  it('returns false when window width is greater than or equal to 768', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)
  })

  it('returns true when window width is less than 768', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)
  })

  it('returns false when window width is exactly 768', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)
  })

  it('returns true when window width is 767', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 767 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)
  })

  it('registers change event listener on mount', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

    renderHook(() => sut())

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes change event listener on unmount', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

    const { unmount } = renderHook(() => sut())
    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates value when window is resized to mobile', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)

    // Simulate resize to mobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })
    act(() => {
      changeHandler?.()
    })

    expect(result.current).toBe(true)
  })

  it('updates value when window is resized to desktop', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)

    // Simulate resize to desktop
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    act(() => {
      changeHandler?.()
    })

    expect(result.current).toBe(false)
  })

  it('creates matchMedia query with correct breakpoint', () => {
    const sut = useIsMobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })

    renderHook(() => sut())

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})
