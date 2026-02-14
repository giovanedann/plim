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
const TRANSITION_DURATION_MS = 400
const TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const ELEMENT_POLL_INTERVAL_MS = 100
const ELEMENT_POLL_MAX_ATTEMPTS = 20
const SETTLE_DURATION_MS = 600

const GLOW_KEYFRAMES = `
@keyframes spotlight-glow-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.01);
  }
}
`

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

function findVisibleElement(elementId: string): Element | null {
  const elements = document.querySelectorAll(`[data-tutorial-id="${elementId}"]`)
  for (const el of elements) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
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
  const prefersReducedMotion = useReducedMotion()
  const styleInjectedRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  const updatePosition = useCallback((): void => {
    if (!elementId) {
      setRect(null)
      return
    }

    const element = findVisibleElement(elementId)
    if (!element) {
      setRect(null)
      return
    }

    setRect(computeRect(element, padding))
  }, [elementId, padding])

  useEffect(() => {
    if (!elementId) {
      setRect(null)
      return
    }

    // Track element position during animations (e.g. sidebar slide-in)
    const startSettle = (): void => {
      const startTime = Date.now()
      const tick = (): void => {
        const el = findVisibleElement(elementId)
        if (el) setRect(computeRect(el, padding))
        if (Date.now() - startTime < SETTLE_DURATION_MS) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const scrollToElement = (el: Element): void => {
      const domRect = el.getBoundingClientRect()
      const isInViewport = domRect.top >= 0 && domRect.bottom <= window.innerHeight
      if (!isInViewport) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    const element = findVisibleElement(elementId)
    if (element) {
      scrollToElement(element)
      setRect(computeRect(element, padding))
      startSettle()
    } else {
      // Element not in DOM yet (e.g. after navigation) — poll until it appears
      setRect(null)
      let attempts = 0

      const poll = (): void => {
        attempts++
        const el = findVisibleElement(elementId)
        if (el) {
          scrollToElement(el)
          setRect(computeRect(el, padding))
          startSettle()
        } else if (attempts < ELEMENT_POLL_MAX_ATTEMPTS) {
          pollTimerRef.current = setTimeout(poll, ELEMENT_POLL_INTERVAL_MS)
        }
      }

      pollTimerRef.current = setTimeout(poll, ELEMENT_POLL_INTERVAL_MS)
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [elementId, padding])

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

  useEffect(() => {
    if (styleInjectedRef.current) return

    const styleElement = document.createElement('style')
    styleElement.setAttribute('data-spotlight-keyframes', '')
    styleElement.textContent = GLOW_KEYFRAMES
    document.head.appendChild(styleElement)
    styleInjectedRef.current = true

    return () => {
      styleElement.remove()
      styleInjectedRef.current = false
    }
  }, [])

  if (!elementId || !rect) {
    return null
  }

  const clipPath = getClipPath(rect)
  const overlayTransition = prefersReducedMotion
    ? undefined
    : `clip-path ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`

  const glowTransition = prefersReducedMotion
    ? undefined
    : `all ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`

  const glowAnimation = prefersReducedMotion
    ? undefined
    : 'spotlight-glow-pulse 2s ease-in-out infinite'

  return (
    <>
      <div
        data-testid="spotlight-overlay"
        className="fixed inset-0 z-[60] pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          clipPath,
          transition: overlayTransition,
        }}
        aria-hidden="true"
      />
      <div
        data-testid="spotlight-glow"
        className="fixed z-[61] pointer-events-none"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 8,
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.3)',
          transition: glowTransition,
          animation: glowAnimation,
        }}
        aria-hidden="true"
      />
    </>
  )
}
