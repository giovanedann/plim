import { analytics } from '@/lib/analytics'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface OnboardingState {
  isOpen: boolean
  currentStep: OnboardingStep
  isReplay: boolean
  showSkipConfirmation: boolean

  // Actions
  open: (isReplay?: boolean) => void
  close: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: OnboardingStep) => void
  complete: () => void
  requestSkip: () => void
  cancelSkip: () => void
  confirmSkip: () => void
  reset: () => void
}

const TOTAL_STEPS = 8

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      currentStep: 1,
      isReplay: false,
      showSkipConfirmation: false,

      open: (isReplay = false) => {
        set({
          isOpen: true,
          isReplay,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      close: () => {
        set({
          isOpen: false,
          showSkipConfirmation: false,
        })
      },

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < TOTAL_STEPS) {
          set({ currentStep: (currentStep + 1) as OnboardingStep })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as OnboardingStep })
        }
      },

      goToStep: (step) => {
        if (step >= 1 && step <= TOTAL_STEPS) {
          set({ currentStep: step })
        }
      },

      complete: () => {
        analytics.onboardingCompleted()
        set({
          isOpen: false,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      requestSkip: () => {
        set({ showSkipConfirmation: true })
      },

      cancelSkip: () => {
        set({ showSkipConfirmation: false })
      },

      confirmSkip: () => {
        analytics.onboardingSkipped(get().currentStep)
        set({
          isOpen: false,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      reset: () => {
        set({
          isOpen: false,
          currentStep: 1,
          isReplay: false,
          showSkipConfirmation: false,
        })
      },
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
      }),
    }
  )
)
