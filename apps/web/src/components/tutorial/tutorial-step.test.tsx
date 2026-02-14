import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TutorialStepCard } from './tutorial-step'

import type { Tutorial } from '@/stores'
import { useTutorialStore } from '@/stores'

const mockTutorial: Tutorial = {
  id: 'add-expense',
  title: 'Adicionar Despesa',
  description: 'Aprenda a adicionar uma nova despesa',
  steps: [
    { elementId: 'step-1', title: 'Primeiro Passo', description: 'Descrição do primeiro passo' },
    { elementId: 'step-2', title: 'Segundo Passo', description: 'Descrição do segundo passo' },
    { elementId: 'step-3', title: 'Terceiro Passo', description: 'Descrição do terceiro passo' },
    { elementId: 'step-4', title: 'Quarto Passo', description: 'Descrição do quarto passo' },
    { elementId: 'step-5', title: 'Quinto Passo', description: 'Descrição do quinto passo' },
  ],
}

function createMockElement(tutorialId: string): HTMLDivElement {
  const element = document.createElement('div')
  element.setAttribute('data-tutorial-id', tutorialId)
  element.getBoundingClientRect = vi.fn(() => ({
    top: 100,
    left: 200,
    width: 150,
    height: 50,
    right: 350,
    bottom: 150,
    x: 200,
    y: 100,
    toJSON: vi.fn(),
  }))
  document.body.appendChild(element)
  return element
}

function setupStoreAndDom(step = 0): void {
  const currentElementId = mockTutorial.steps[step]!.elementId
  createMockElement(currentElementId)

  useTutorialStore.setState({
    activeTutorial: mockTutorial,
    currentStep: step,
  })
}

describe('TutorialStepCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    useTutorialStore.setState({
      activeTutorial: null,
      currentStep: 0,
    })
  })

  it('renders nothing when no active tutorial', () => {
    const { container } = render(<TutorialStepCard />)

    expect(container.innerHTML).toBe('')
  })

  it('renders title and description', () => {
    setupStoreAndDom(0)

    render(<TutorialStepCard />)

    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument()
    expect(screen.getByText('Descrição do primeiro passo')).toBeInTheDocument()
  })

  it('renders step indicator', () => {
    setupStoreAndDom(2)

    render(<TutorialStepCard />)

    expect(screen.getByTestId('tutorial-step-indicator')).toHaveTextContent('Passo 3 de 5')
  })

  it('renders next button', () => {
    setupStoreAndDom(0)

    render(<TutorialStepCard />)

    expect(screen.getByTestId('tutorial-next-button')).toBeInTheDocument()
    expect(screen.getByTestId('tutorial-next-button')).toHaveTextContent('Próximo')
  })

  it('renders back button when not on first step', () => {
    setupStoreAndDom(1)

    render(<TutorialStepCard />)

    expect(screen.getByTestId('tutorial-prev-button')).toBeInTheDocument()
    expect(screen.getByTestId('tutorial-prev-button')).toHaveTextContent('Anterior')
  })

  it('hides back button on first step and shows skip instead', () => {
    setupStoreAndDom(0)

    render(<TutorialStepCard />)

    expect(screen.queryByTestId('tutorial-prev-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('tutorial-skip-button')).toBeInTheDocument()
  })

  it('calls nextStep on next button click', async () => {
    setupStoreAndDom(0)
    createMockElement('step-2')
    const user = userEvent.setup()

    render(<TutorialStepCard />)

    await user.click(screen.getByTestId('tutorial-next-button'))

    expect(useTutorialStore.getState().currentStep).toBe(1)
  })

  it('calls prevStep on back button click', async () => {
    setupStoreAndDom(2)
    createMockElement('step-2')
    const user = userEvent.setup()

    render(<TutorialStepCard />)

    await user.click(screen.getByTestId('tutorial-prev-button'))

    expect(useTutorialStore.getState().currentStep).toBe(1)
  })

  it('renders exit button', () => {
    setupStoreAndDom(0)

    render(<TutorialStepCard />)

    expect(screen.getByTestId('tutorial-exit-button')).toBeInTheDocument()
  })

  it('calls exitTutorial on exit click', async () => {
    setupStoreAndDom(0)
    const user = userEvent.setup()

    render(<TutorialStepCard />)

    await user.click(screen.getByTestId('tutorial-exit-button'))

    expect(useTutorialStore.getState().activeTutorial).toBeNull()
  })

  it('shows Concluir on last step', () => {
    setupStoreAndDom(4)

    render(<TutorialStepCard />)

    expect(screen.getByTestId('tutorial-next-button')).toHaveTextContent('Concluir')
  })

  it('exits tutorial on last step next click', async () => {
    setupStoreAndDom(4)
    const user = userEvent.setup()

    render(<TutorialStepCard />)

    await user.click(screen.getByTestId('tutorial-next-button'))

    const state = useTutorialStore.getState()
    expect(state.activeTutorial).toBeNull()
    expect(state.currentStep).toBe(0)
  })
})
