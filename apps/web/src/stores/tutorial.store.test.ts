import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Tutorial, registerTutorials, useTutorialStore } from './tutorial.store'

vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

const mockTutorial: Tutorial = {
  id: 'add-expense',
  title: 'Adicionar Despesa',
  description: 'Aprenda a adicionar uma nova despesa',
  steps: [
    { elementId: 'sidebar-nav-expenses', title: 'Despesas', description: 'Navegue para despesas' },
    { elementId: 'expense-add-button', title: 'Adicionar', description: 'Clique para adicionar' },
    { elementId: 'expense-form-amount', title: 'Valor', description: 'Digite o valor' },
    { elementId: 'expense-form-type', title: 'Tipo', description: 'Selecione o tipo' },
    { elementId: 'expense-form-save', title: 'Salvar', description: 'Salve a despesa' },
  ],
}

describe('useTutorialStore', () => {
  const initialState = {
    activeTutorial: null,
    currentStep: 0,
  }

  beforeEach(() => {
    useTutorialStore.setState(initialState)
  })

  describe('initial state', () => {
    it('has no active tutorial', () => {
      const sut = useTutorialStore.getState()

      expect(sut.activeTutorial).toBeNull()
    })

    it('has currentStep as 0', () => {
      const sut = useTutorialStore.getState()

      expect(sut.currentStep).toBe(0)
    })
  })

  describe('startTutorial', () => {
    it('sets active tutorial and resets step to 0', () => {
      const sut = useTutorialStore.getState()

      sut.startTutorial(mockTutorial)

      const state = useTutorialStore.getState()
      expect(state.activeTutorial).toEqual(mockTutorial)
      expect(state.currentStep).toBe(0)
    })

    it('resets step to 0 when starting new tutorial', () => {
      useTutorialStore.setState({ currentStep: 3 })
      const sut = useTutorialStore.getState()

      sut.startTutorial(mockTutorial)

      const state = useTutorialStore.getState()
      expect(state.currentStep).toBe(0)
    })
  })

  describe('nextStep', () => {
    it('increments current step', () => {
      useTutorialStore.setState({ activeTutorial: mockTutorial, currentStep: 0 })
      const sut = useTutorialStore.getState()

      sut.nextStep()

      expect(useTutorialStore.getState().currentStep).toBe(1)
    })

    it('does not exceed total steps', () => {
      useTutorialStore.setState({ activeTutorial: mockTutorial, currentStep: 4 })
      const sut = useTutorialStore.getState()

      sut.nextStep()

      expect(useTutorialStore.getState().currentStep).toBe(4)
    })

    it('does nothing when no active tutorial', () => {
      const sut = useTutorialStore.getState()

      sut.nextStep()

      expect(useTutorialStore.getState().currentStep).toBe(0)
    })
  })

  describe('prevStep', () => {
    it('decrements current step', () => {
      useTutorialStore.setState({ activeTutorial: mockTutorial, currentStep: 2 })
      const sut = useTutorialStore.getState()

      sut.prevStep()

      expect(useTutorialStore.getState().currentStep).toBe(1)
    })

    it('does not go below 0', () => {
      useTutorialStore.setState({ activeTutorial: mockTutorial, currentStep: 0 })
      const sut = useTutorialStore.getState()

      sut.prevStep()

      expect(useTutorialStore.getState().currentStep).toBe(0)
    })
  })

  describe('exitTutorial', () => {
    it('clears active tutorial', () => {
      useTutorialStore.setState({ activeTutorial: mockTutorial, currentStep: 3 })
      const sut = useTutorialStore.getState()

      sut.exitTutorial()

      const state = useTutorialStore.getState()
      expect(state.activeTutorial).toBeNull()
      expect(state.currentStep).toBe(0)
    })
  })

  describe('startTutorialById', () => {
    it('starts tutorial by id from registry', () => {
      registerTutorials([mockTutorial])
      const sut = useTutorialStore.getState()

      sut.startTutorialById('add-expense')

      const state = useTutorialStore.getState()
      expect(state.activeTutorial).toEqual(mockTutorial)
      expect(state.currentStep).toBe(0)
    })

    it('does nothing when tutorial id is not found', () => {
      registerTutorials([mockTutorial])
      const sut = useTutorialStore.getState()

      sut.startTutorialById('nonexistent')

      const state = useTutorialStore.getState()
      expect(state.activeTutorial).toBeNull()
    })
  })
})
