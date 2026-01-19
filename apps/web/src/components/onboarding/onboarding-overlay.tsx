import { useOnboardingStore } from '@/stores/onboarding.store'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect } from 'react'
import { OnboardingNavigation } from './onboarding-navigation'
import { OnboardingProgress } from './onboarding-progress'
import { SkipConfirmationModal } from './skip-confirmation-modal'
import {
  CategoriesStep,
  DashboardStep,
  ExpenseTypesStep,
  ReadyStep,
  SalaryStep,
  WelcomeStep,
} from './steps'

interface OnboardingOverlayProps {
  existingSalary?: number | null
  onSaveSalary: (salary: number) => Promise<void>
  onComplete: () => Promise<void>
}

export function OnboardingOverlay({
  existingSalary,
  onSaveSalary,
  onComplete,
}: OnboardingOverlayProps) {
  const {
    isOpen,
    currentStep,
    isReplay,
    showSkipConfirmation,
    nextStep,
    prevStep,
    complete,
    requestSkip,
    cancelSkip,
    confirmSkip,
  } = useOnboardingStore()

  const handleNext = useCallback(async () => {
    if (currentStep === 6) {
      await onComplete()
      complete()
    } else {
      nextStep()
    }
  }, [currentStep, nextStep, complete, onComplete])

  const handleConfirmSkip = useCallback(async () => {
    await onComplete()
    confirmSkip()
  }, [confirmSkip, onComplete])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSkipConfirmation) {
        if (e.key === 'Escape') {
          cancelSkip()
        }
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          handleNext()
          break
        case 'ArrowLeft':
          if (currentStep > 1) {
            prevStep()
          }
          break
        case 'Escape':
          requestSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, showSkipConfirmation, handleNext, prevStep, requestSkip, cancelSkip])

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <ExpenseTypesStep />
      case 3:
        return (
          <SalaryStep existingSalary={existingSalary} onSave={onSaveSalary} isReplay={isReplay} />
        )
      case 4:
        return <CategoriesStep />
      case 5:
        return <DashboardStep />
      case 6:
        return <ReadyStep />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        >
          {/* Content area */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <AnimatePresence mode="wait">
              <div key={currentStep}>{renderStep()}</div>
            </AnimatePresence>
          </div>

          {/* Footer with progress and navigation */}
          <div className="shrink-0 pb-8 px-6">
            <div className="max-w-md mx-auto space-y-6">
              <OnboardingProgress currentStep={currentStep} />
              <OnboardingNavigation
                onNext={handleNext}
                onPrev={prevStep}
                onSkip={requestSkip}
                isFirstStep={currentStep === 1}
                isLastStep={currentStep === 6}
              />
            </div>
          </div>

          {/* Skip confirmation modal */}
          <SkipConfirmationModal
            isOpen={showSkipConfirmation}
            onConfirm={handleConfirmSkip}
            onCancel={cancelSkip}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
