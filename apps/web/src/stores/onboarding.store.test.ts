import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type OnboardingStep, useOnboardingStore } from './onboarding.store'

// Mock zustand persist middleware to avoid localStorage interactions
vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

describe('useOnboardingStore', () => {
  const initialState = {
    isOpen: false,
    currentStep: 1 as OnboardingStep,
    isReplay: false,
    showSkipConfirmation: false,
  }

  beforeEach(() => {
    // Reset store state before each test
    useOnboardingStore.setState(initialState)
  })

  describe('initial state', () => {
    it('has isOpen as false by default', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Assert
      expect(sut.isOpen).toBe(false)
    })

    it('has currentStep as 1 by default', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Assert
      expect(sut.currentStep).toBe(1)
    })

    it('has isReplay as false by default', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Assert
      expect(sut.isReplay).toBe(false)
    })

    it('has showSkipConfirmation as false by default', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Assert
      expect(sut.showSkipConfirmation).toBe(false)
    })
  })

  describe('open', () => {
    it('opens onboarding with isReplay false by default', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Act
      sut.open()

      // Assert
      const state = useOnboardingStore.getState()
      expect(state.isOpen).toBe(true)
      expect(state.isReplay).toBe(false)
      expect(state.currentStep).toBe(1)
      expect(state.showSkipConfirmation).toBe(false)
    })

    it('opens onboarding with isReplay true when specified', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Act
      sut.open(true)

      // Assert
      const state = useOnboardingStore.getState()
      expect(state.isOpen).toBe(true)
      expect(state.isReplay).toBe(true)
    })

    it('resets currentStep to 1 when opening', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 4 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.open()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('resets showSkipConfirmation when opening', () => {
      // Arrange
      useOnboardingStore.setState({ showSkipConfirmation: true })
      const sut = useOnboardingStore.getState()

      // Act
      sut.open()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('close', () => {
    it('closes onboarding', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true })
      const sut = useOnboardingStore.getState()

      // Act
      sut.close()

      // Assert
      expect(useOnboardingStore.getState().isOpen).toBe(false)
    })

    it('resets showSkipConfirmation when closing', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true, showSkipConfirmation: true })
      const sut = useOnboardingStore.getState()

      // Act
      sut.close()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('nextStep', () => {
    it('advances from step 1 to step 2', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 1 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.nextStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(2)
    })

    it('advances from step 5 to step 6', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 5 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.nextStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(6)
    })

    it('does not advance beyond step 6', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.nextStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(6)
    })

    it('advances through all steps sequentially', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 1 })
      const sut = useOnboardingStore.getState()

      // Act & Assert
      for (let i = 2; i <= 6; i++) {
        sut.nextStep()
        expect(useOnboardingStore.getState().currentStep).toBe(i)
      }
    })
  })

  describe('prevStep', () => {
    it('goes back from step 2 to step 1', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 2 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.prevStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('goes back from step 6 to step 5', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.prevStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(5)
    })

    it('does not go back beyond step 1', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 1 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.prevStep()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('goes back through all steps sequentially', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act & Assert
      for (let i = 5; i >= 1; i--) {
        sut.prevStep()
        expect(useOnboardingStore.getState().currentStep).toBe(i)
      }
    })
  })

  describe('goToStep', () => {
    it.each([1, 2, 3, 4, 5, 6] as OnboardingStep[])('goes to step %i when valid', (step) => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Act
      sut.goToStep(step)

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(step)
    })

    it('does not change step when given step below 1', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 3 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.goToStep(0 as OnboardingStep)

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(3)
    })

    it('does not change step when given step above 6', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 3 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.goToStep(7 as OnboardingStep)

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(3)
    })

    it('can jump from step 1 to step 6', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 1 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.goToStep(6)

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(6)
    })

    it('can jump from step 6 to step 1', () => {
      // Arrange
      useOnboardingStore.setState({ currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.goToStep(1)

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })
  })

  describe('complete', () => {
    it('closes onboarding', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true, currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.complete()

      // Assert
      expect(useOnboardingStore.getState().isOpen).toBe(false)
    })

    it('resets currentStep to 1', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true, currentStep: 6 })
      const sut = useOnboardingStore.getState()

      // Act
      sut.complete()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('resets showSkipConfirmation', () => {
      // Arrange
      useOnboardingStore.setState({
        isOpen: true,
        currentStep: 6,
        showSkipConfirmation: true,
      })
      const sut = useOnboardingStore.getState()

      // Act
      sut.complete()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('requestSkip', () => {
    it('shows skip confirmation dialog', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Act
      sut.requestSkip()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(true)
    })
  })

  describe('cancelSkip', () => {
    it('hides skip confirmation dialog', () => {
      // Arrange
      useOnboardingStore.setState({ showSkipConfirmation: true })
      const sut = useOnboardingStore.getState()

      // Act
      sut.cancelSkip()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('confirmSkip', () => {
    it('closes onboarding', () => {
      // Arrange
      useOnboardingStore.setState({
        isOpen: true,
        currentStep: 3,
        showSkipConfirmation: true,
      })
      const sut = useOnboardingStore.getState()

      // Act
      sut.confirmSkip()

      // Assert
      expect(useOnboardingStore.getState().isOpen).toBe(false)
    })

    it('resets currentStep to 1', () => {
      // Arrange
      useOnboardingStore.setState({
        isOpen: true,
        currentStep: 3,
        showSkipConfirmation: true,
      })
      const sut = useOnboardingStore.getState()

      // Act
      sut.confirmSkip()

      // Assert
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('resets showSkipConfirmation', () => {
      // Arrange
      useOnboardingStore.setState({
        isOpen: true,
        currentStep: 3,
        showSkipConfirmation: true,
      })
      const sut = useOnboardingStore.getState()

      // Act
      sut.confirmSkip()

      // Assert
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Arrange
      useOnboardingStore.setState({
        isOpen: true,
        currentStep: 5,
        isReplay: true,
        showSkipConfirmation: true,
      })
      const sut = useOnboardingStore.getState()

      // Act
      sut.reset()

      // Assert
      const state = useOnboardingStore.getState()
      expect(state.isOpen).toBe(false)
      expect(state.currentStep).toBe(1)
      expect(state.isReplay).toBe(false)
      expect(state.showSkipConfirmation).toBe(false)
    })
  })

  describe('skip flow', () => {
    it('completes skip flow correctly', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true, currentStep: 3 })
      const sut = useOnboardingStore.getState()

      // Act - request skip
      sut.requestSkip()

      // Assert - confirmation shown
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(true)
      expect(useOnboardingStore.getState().isOpen).toBe(true)

      // Act - confirm skip
      sut.confirmSkip()

      // Assert - onboarding closed
      expect(useOnboardingStore.getState().isOpen).toBe(false)
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })

    it('cancels skip flow correctly', () => {
      // Arrange
      useOnboardingStore.setState({ isOpen: true, currentStep: 3 })
      const sut = useOnboardingStore.getState()

      // Act - request skip
      sut.requestSkip()
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(true)

      // Act - cancel skip
      sut.cancelSkip()

      // Assert - still open at same step
      expect(useOnboardingStore.getState().isOpen).toBe(true)
      expect(useOnboardingStore.getState().currentStep).toBe(3)
      expect(useOnboardingStore.getState().showSkipConfirmation).toBe(false)
    })
  })

  describe('replay flow', () => {
    it('completes replay flow correctly', () => {
      // Arrange
      const sut = useOnboardingStore.getState()

      // Act - start replay
      sut.open(true)

      // Assert - replay mode
      const openState = useOnboardingStore.getState()
      expect(openState.isOpen).toBe(true)
      expect(openState.isReplay).toBe(true)
      expect(openState.currentStep).toBe(1)

      // Act - navigate through steps
      sut.nextStep()
      sut.nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(3)

      // Act - complete
      sut.complete()

      // Assert - closed
      expect(useOnboardingStore.getState().isOpen).toBe(false)
    })
  })
})
