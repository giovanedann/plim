import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import type { OnboardingStep } from '@/stores/onboarding.store'
import { motion } from 'motion/react'

interface OnboardingProgressProps {
  currentStep: OnboardingStep
  totalSteps?: number
}

export function OnboardingProgress({ currentStep, totalSteps = 8 }: OnboardingProgressProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <motion.div
          key={step}
          className={cn(
            'h-2 rounded-full transition-colors duration-200',
            step === currentStep
              ? 'bg-primary w-6'
              : step < currentStep
                ? 'bg-primary/60 w-2'
                : 'bg-muted w-2'
          )}
          initial={false}
          animate={{
            width: step === currentStep ? 24 : 8,
          }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        />
      ))}
    </div>
  )
}
