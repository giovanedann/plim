import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './use-reduced-motion'

interface UseCountUpOptions {
  duration?: number
  decimals?: number
}

export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { duration = 800, decimals = 0 } = options
  const [value, setValue] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const previousTarget = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    // Only animate when target changes from 0/undefined to a value
    const shouldAnimate =
      previousTarget.current === undefined ||
      previousTarget.current === 0 ||
      previousTarget.current !== target

    previousTarget.current = target

    if (!shouldAnimate || target === 0) {
      setValue(target)
      return
    }

    const startValue = 0
    const startTime = performance.now()
    const multiplier = 10 ** decimals

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - (1 - progress) ** 3
      const currentValue = startValue + (target - startValue) * easeOut

      setValue(Math.round(currentValue * multiplier) / multiplier)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setValue(target)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration, decimals, prefersReducedMotion])

  return value
}
