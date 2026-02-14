import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface SpotlightProps {
  elementId?: string
  padding?: number
}

const SPOTLIGHT_PADDING = 8
const TRANSITION_DURATION_MS = 300

function getClipPath(rect: SpotlightRect): string {
  const { top, left, width, height } = rect
  const right = left + width
  const bottom = top + height

  return `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${left}px ${top}px,
    ${left}px ${bottom}px,
    ${right}px ${bottom}px,
    ${right}px ${top}px,
    ${left}px ${top}px
  )`
}

function computeRect(element: Element, padding: number): SpotlightRect {
  const domRect = element.getBoundingClientRect()
  return {
    top: domRect.top - padding,
    left: domRect.left - padding,
    width: domRect.width + padding * 2,
    height: domRect.height + padding * 2,
  }
}

export function Spotlight({
  elementId,
  padding = SPOTLIGHT_PADDING,
}: SpotlightProps): React.ReactNode {
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const previousElementIdRef = useRef<string | undefined>(undefined)

  const updatePosition = useCallback((): void => {
    if (!elementId) {
      setRect(null)
      return
    }

    const element = document.querySelector(`[data-tutorial-id="${elementId}"]`)
    if (!element) {
      setRect(null)
      return
    }

    setRect(computeRect(element, padding))
  }, [elementId, padding])

  useEffect(() => {
    if (previousElementIdRef.current !== undefined && previousElementIdRef.current !== elementId) {
      if (!prefersReducedMotion) {
        setIsTransitioning(true)
        const timer = setTimeout(() => {
          setIsTransitioning(false)
        }, TRANSITION_DURATION_MS)
        return () => clearTimeout(timer)
      }
    }
    previousElementIdRef.current = elementId
  }, [elementId, prefersReducedMotion])

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    const handleResize = (): void => {
      updatePosition()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [updatePosition])

  if (!elementId || !rect) {
    return null
  }

  const clipPath = getClipPath(rect)
  const transitionStyle =
    prefersReducedMotion || !isTransitioning
      ? undefined
      : `clip-path ${TRANSITION_DURATION_MS}ms ease-in-out`

  return (
    <div
      data-testid="spotlight-overlay"
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        clipPath,
        transition: transitionStyle,
      }}
      aria-hidden="true"
    />
  )
}
