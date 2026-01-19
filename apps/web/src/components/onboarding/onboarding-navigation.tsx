import { Button } from '@/components/ui/button'
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
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={onPrev}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Voltar
            </Button>
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
        >
          Pular tutorial
        </button>
      )}
    </div>
  )
}
