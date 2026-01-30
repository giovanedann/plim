import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountUp } from './use-count-up'

vi.mock('./use-reduced-motion', () => ({
  useReducedMotion: vi.fn(),
}))

import { useReducedMotion } from './use-reduced-motion'

describe('useCountUp', () => {
  let animationFrameCallbacks: ((time: number) => void)[] = []
  let currentTime = 0

  beforeEach(() => {
    vi.clearAllMocks()
    animationFrameCallbacks = []
    currentTime = 0

    vi.mocked(useReducedMotion).mockReturnValue(false)

    vi.spyOn(performance, 'now').mockImplementation(() => currentTime)

    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallbacks.push(callback)
      return animationFrameCallbacks.length
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function advanceTime(ms: number) {
    currentTime += ms
    const callbacks = [...animationFrameCallbacks]
    animationFrameCallbacks = []
    for (const cb of callbacks) {
      cb(currentTime)
    }
  }

  it('starts at 0', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100))

    // Before any animation frame runs
    expect(result.current).toBe(0)
  })

  it('animates to target value', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100, { duration: 800 }))

    // Advance time partially
    act(() => advanceTime(400))

    // Should be somewhere between 0 and 100
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(100)

    // Complete animation
    act(() => advanceTime(500))

    expect(result.current).toBe(100)
  })

  it('reaches target value at end of duration', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100, { duration: 800 }))

    // Complete animation
    act(() => advanceTime(800))
    act(() => advanceTime(100)) // Extra frame to finalize

    expect(result.current).toBe(100)
  })

  it('respects decimal places option', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(99.99, { duration: 800, decimals: 2 }))

    // Advance partially
    act(() => advanceTime(400))

    // Value should have up to 2 decimal places
    const decimalPart = result.current.toString().split('.')[1] || ''
    expect(decimalPart.length).toBeLessThanOrEqual(2)

    // Complete animation
    act(() => advanceTime(500))

    expect(result.current).toBe(99.99)
  })

  it('skips animation when user prefers reduced motion', () => {
    const sut = useCountUp
    vi.mocked(useReducedMotion).mockReturnValue(true)

    const { result } = renderHook(() => sut(100))

    // Should immediately be at target without animation
    expect(result.current).toBe(100)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('sets value immediately when target is 0', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(0))

    expect(result.current).toBe(0)
  })

  it('uses default duration of 800ms', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100))

    // At 800ms should be complete
    act(() => advanceTime(800))
    act(() => advanceTime(100))

    expect(result.current).toBe(100)
  })

  it('uses custom duration', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100, { duration: 400 }))

    // At 400ms should be complete
    act(() => advanceTime(400))
    act(() => advanceTime(100))

    expect(result.current).toBe(100)
  })

  it('animates with easing (value increases faster at start)', () => {
    const sut = useCountUp

    const { result } = renderHook(() => sut(100, { duration: 800 }))

    // At 50% time, value should be more than 50% due to ease out cubic
    act(() => advanceTime(400))

    // Ease out cubic at 50%: 1 - (1 - 0.5)^3 = 1 - 0.125 = 0.875
    // So value should be around 87.5
    expect(result.current).toBeGreaterThan(50)
  })

  it('updates when target changes', () => {
    const sut = useCountUp

    const { result, rerender } = renderHook(({ target }) => sut(target, { duration: 800 }), {
      initialProps: { target: 100 },
    })

    // Complete first animation
    act(() => advanceTime(800))
    act(() => advanceTime(100))

    expect(result.current).toBe(100)

    // Change target
    rerender({ target: 200 })

    // New animation should start
    act(() => advanceTime(800))
    act(() => advanceTime(100))

    expect(result.current).toBe(200)
  })
})
