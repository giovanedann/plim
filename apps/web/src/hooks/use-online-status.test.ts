import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnlineStatus } from './use-online-status'

describe('useOnlineStatus', () => {
  let originalOnLine: boolean

  beforeEach(() => {
    vi.clearAllMocks()
    originalOnLine = navigator.onLine
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalOnLine,
    })
  })

  it('returns true when navigator.onLine is true', () => {
    const sut = useOnlineStatus
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine is false', () => {
    const sut = useOnlineStatus
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)
  })

  it('updates when online event fires', () => {
    const sut = useOnlineStatus
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(false)

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('updates when offline event fires', () => {
    const sut = useOnlineStatus
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => sut())

    expect(result.current).toBe(true)

    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    })
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('subscribes to window online and offline events on mount', () => {
    const sut = useOnlineStatus
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() => sut())

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    addEventListenerSpy.mockRestore()
  })

  it('unsubscribes from window events on unmount', () => {
    const sut = useOnlineStatus
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => sut())
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
