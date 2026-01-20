import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'

interface OnboardingNavigationProps {
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
  nextLabel?: string
  className?: string
}

export function OnboardingNavigation({
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep,
  nextLabel,
  className,
}: OnboardingNavigationProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={onPrev}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Voltar
            </Button>
          </motion.div>
        )}

        <motion.div
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        >
          <Button size="lg" onClick={onNext} className="min-w-[140px]">
            {nextLabel || (isLastStep ? 'Começar a usar' : 'Próximo')}
            {!isLastStep && <ChevronRight className="h-5 w-5 ml-1" />}
          </Button>
        </motion.div>
      </div>

      {!isLastStep && (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors underline-offset-4 hover:underline"
        >
          Pular tutorial
        </button>
      )}
    </div>
  )
}
