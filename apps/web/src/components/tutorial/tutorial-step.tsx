import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTutorialStore } from '@/stores'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Position {
  top: number
  left: number
}

function findVisibleElement(elementId: string): Element | null {
  const elements = document.querySelectorAll(`[data-tutorial-id="${elementId}"]`)
  for (const el of elements) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
}

function computeCardPosition(elementId: string): Position | null {
  const element = findVisibleElement(elementId)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  const cardWidth = 320
  const cardHeight = 200
  const gap = 16

  let top = rect.bottom + gap
  let left = rect.left

  // If card would go below viewport, position above
  if (top + cardHeight > window.innerHeight) {
    top = rect.top - cardHeight - gap
  }

  // If card would go off right edge, align to right of element
  if (left + cardWidth > window.innerWidth) {
    left = rect.right - cardWidth
  }

  // Ensure card stays on screen
  left = Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8))
  top = Math.max(8, top)

  return { top, left }
}

const ELEMENT_POLL_INTERVAL_MS = 100
const ELEMENT_POLL_MAX_ATTEMPTS = 20
const SETTLE_DURATION_MS = 600

export function TutorialStepCard(): React.ReactNode {
  const { activeTutorial, currentStep, nextStep, prevStep, exitTutorial } = useTutorialStore()
  const navigate = useNavigate()
  const [position, setPosition] = useState<Position | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  const step = activeTutorial?.steps[currentStep]
  const totalSteps = activeTutorial?.steps.length ?? 0
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  useEffect(() => {
    if (!step) {
      setPosition(null)
      return
    }

    // Auto-navigate when step has navigateTo and element is not in DOM
    const element = findVisibleElement(step.elementId)
    if (!element && step.navigateTo) {
      navigate({ to: step.navigateTo })
    }

    // Track element position during animations (e.g. sidebar slide-in)
    const startSettle = (): void => {
      const startTime = Date.now()
      const tick = (): void => {
        const pos = computeCardPosition(step.elementId)
        if (pos) setPosition(pos)
        if (Date.now() - startTime < SETTLE_DURATION_MS) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    // Try to find the element immediately
    const pos = computeCardPosition(step.elementId)
    if (pos) {
      setPosition(pos)
      startSettle()
    } else {
      // Element not in DOM yet (e.g. after navigation) — poll until it appears
      setPosition(null)
      let attempts = 0

      const poll = (): void => {
        attempts++
        const found = computeCardPosition(step.elementId)
        if (found) {
          setPosition(found)
          startSettle()
        } else if (attempts < ELEMENT_POLL_MAX_ATTEMPTS) {
          pollTimerRef.current = setTimeout(poll, ELEMENT_POLL_INTERVAL_MS)
        }
      }

      pollTimerRef.current = setTimeout(poll, ELEMENT_POLL_INTERVAL_MS)
    }

    const handleResize = (): void => {
      setPosition(computeCardPosition(step.elementId))
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [step, navigate])

  if (!activeTutorial || !step || !position) {
    return null
  }

  const handleNext = (): void => {
    if (isLastStep) {
      exitTutorial()
    } else {
      const nextStepData = activeTutorial?.steps[currentStep + 1]
      if (step.navigateTo && nextStepData && nextStepData.elementId !== step.elementId) {
        navigate({ to: step.navigateTo })
      }
      nextStep()
    }
  }

  return (
    <Card
      ref={cardRef}
      data-testid="tutorial-step-card"
      className="fixed z-[70] w-80 shadow-lg pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{step.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={exitTutorial}
            data-testid="tutorial-exit-button"
            aria-label="Fechar tutorial"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground" data-testid="tutorial-step-indicator">
          Passo {currentStep + 1} de {totalSteps}
        </span>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </CardContent>

      <CardFooter className="flex justify-between pt-0">
        {!isFirstStep ? (
          <Button variant="outline" size="sm" onClick={prevStep} data-testid="tutorial-prev-button">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={exitTutorial}
            data-testid="tutorial-skip-button"
          >
            Pular
          </Button>
        )}

        <Button size="sm" onClick={handleNext} data-testid="tutorial-next-button">
          {isLastStep ? 'Concluir' : 'Próximo'}
          {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
