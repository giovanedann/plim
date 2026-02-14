import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TutorialStep {
  elementId: string
  title: string
  description: string
  action?: 'click' | 'navigate' | 'observe'
  nextCondition?: 'click' | 'auto' | 'manual'
}

export interface Tutorial {
  id: string
  title: string
  description: string
  steps: TutorialStep[]
}

interface TutorialState {
  activeTutorial: Tutorial | null
  currentStep: number
  completedTutorials: string[]

  startTutorial: (tutorial: Tutorial) => void
  nextStep: () => void
  prevStep: () => void
  exitTutorial: () => void
  completeTutorial: () => void
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      activeTutorial: null,
      currentStep: 0,
      completedTutorials: [],

      startTutorial: (tutorial) => {
        set({
          activeTutorial: tutorial,
          currentStep: 0,
        })
      },

      nextStep: () => {
        const { activeTutorial, currentStep } = get()
        if (!activeTutorial) return

        const lastStepIndex = activeTutorial.steps.length - 1
        if (currentStep < lastStepIndex) {
          set({ currentStep: currentStep + 1 })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      exitTutorial: () => {
        set({
          activeTutorial: null,
          currentStep: 0,
        })
      },

      completeTutorial: () => {
        const { activeTutorial, completedTutorials } = get()
        if (!activeTutorial) return

        set({
          activeTutorial: null,
          currentStep: 0,
          completedTutorials: completedTutorials.includes(activeTutorial.id)
            ? completedTutorials
            : [...completedTutorials, activeTutorial.id],
        })
      },
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({
        completedTutorials: state.completedTutorials,
      }),
    }
  )
)
