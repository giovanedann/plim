import { useTutorialStore } from '@/stores'
import type { Tutorial } from '@/stores/tutorial.store'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Spotlight } from '../spotlight'
import { TutorialStepCard } from '../tutorial-step'

const TEST_TUTORIAL: Tutorial = {
  id: 'test-tutorial',
  title: 'Tutorial de teste',
  description: 'Descrição do tutorial de teste',
  steps: [
    {
      elementId: 'step-one-element',
      title: 'Primeiro passo',
      description: 'Descrição do primeiro passo.',
      action: 'navigate',
    },
    {
      elementId: 'step-two-element',
      title: 'Segundo passo',
      description: 'Descrição do segundo passo.',
      action: 'click',
    },
    {
      elementId: 'step-three-element',
      title: 'Terceiro passo',
      description: 'Descrição do terceiro passo.',
      action: 'observe',
    },
  ],
}

function createTargetElement(id: string): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('data-tutorial-id', id)
  el.style.position = 'absolute'
  el.style.top = '100px'
  el.style.left = '100px'
  el.style.width = '200px'
  el.style.height = '50px'
  el.getBoundingClientRect = () => ({
    top: 100,
    left: 100,
    bottom: 150,
    right: 300,
    width: 200,
    height: 50,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  })
  document.body.appendChild(el)
  return el
}

function TutorialTestHarness(): React.ReactNode {
  const { activeTutorial, currentStep } = useTutorialStore()
  const step = activeTutorial?.steps[currentStep]

  return (
    <>
      <Spotlight elementId={step?.elementId} />
      <TutorialStepCard />
    </>
  )
}

describe('Tutorial Flow Integration', () => {
  let user: ReturnType<typeof userEvent.setup>
  let targetElements: HTMLDivElement[]

  beforeEach(() => {
    user = userEvent.setup()
    targetElements = []

    useTutorialStore.setState({
      activeTutorial: null,
      currentStep: 0,
    })
  })

  afterEach(() => {
    for (const el of targetElements) {
      el.remove()
    }
    targetElements = []
  })

  function addTargetElements(): void {
    for (const step of TEST_TUTORIAL.steps) {
      targetElements.push(createTargetElement(step.elementId))
    }
  }

  describe('spotlight highlights correct element for each step', () => {
    it('renders spotlight overlay when tutorial is active', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('spotlight-overlay')).toBeInTheDocument()
      })
    })

    it('renders no spotlight when no tutorial is active', () => {
      render(<TutorialTestHarness />)

      expect(screen.queryByTestId('spotlight-overlay')).not.toBeInTheDocument()
    })

    it('displays the first step title and description', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
        expect(screen.getByText('Descrição do primeiro passo.')).toBeInTheDocument()
      })
    })

    it('shows correct step indicator', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-step-indicator')).toHaveTextContent('Passo 1 de 3')
      })
    })
  })

  describe('next button advances through all steps', () => {
    it('advances to step 2 on next click', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Segundo passo')).toBeInTheDocument()
        expect(screen.getByText('Descrição do segundo passo.')).toBeInTheDocument()
        expect(screen.getByTestId('tutorial-step-indicator')).toHaveTextContent('Passo 2 de 3')
      })
    })

    it('advances to step 3 from step 2', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Segundo passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Terceiro passo')).toBeInTheDocument()
        expect(screen.getByTestId('tutorial-step-indicator')).toHaveTextContent('Passo 3 de 3')
      })
    })

    it('shows "Concluir" on the last step', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-next-button')).toHaveTextContent('Próximo')
      })

      await user.click(screen.getByTestId('tutorial-next-button'))
      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-next-button')).toHaveTextContent('Concluir')
      })
    })
  })

  describe('back button goes to previous step', () => {
    it('shows "Pular" on first step instead of back button', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-skip-button')).toHaveTextContent('Pular')
        expect(screen.queryByTestId('tutorial-prev-button')).not.toBeInTheDocument()
      })
    })

    it('shows "Anterior" button on step 2', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-prev-button')).toHaveTextContent('Anterior')
      })
    })

    it('navigates back to step 1 from step 2', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Segundo passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-prev-button'))

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
        expect(screen.getByTestId('tutorial-step-indicator')).toHaveTextContent('Passo 1 de 3')
      })
    })
  })

  describe('exit closes tutorial at any step', () => {
    it('closes tutorial from the first step via exit button', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-step-card')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-exit-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-step-card')).not.toBeInTheDocument()
        expect(screen.queryByTestId('spotlight-overlay')).not.toBeInTheDocument()
      })
    })

    it('closes tutorial from the first step via skip button', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByTestId('tutorial-skip-button')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-skip-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-step-card')).not.toBeInTheDocument()
      })
    })

    it('closes tutorial from a middle step', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Segundo passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-exit-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-step-card')).not.toBeInTheDocument()
      })
    })
  })

  describe('tutorial completes after last step', () => {
    it('exits tutorial when clicking finish on last step', async () => {
      addTargetElements()

      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.getByText('Primeiro passo')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('tutorial-next-button'))
      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.getByText('Terceiro passo')).toBeInTheDocument()
        expect(screen.getByTestId('tutorial-next-button')).toHaveTextContent('Concluir')
      })

      await user.click(screen.getByTestId('tutorial-next-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-step-card')).not.toBeInTheDocument()
        expect(screen.queryByTestId('spotlight-overlay')).not.toBeInTheDocument()
      })

      expect(useTutorialStore.getState().activeTutorial).toBeNull()
      expect(useTutorialStore.getState().currentStep).toBe(0)
    })
  })

  describe('handles missing DOM element gracefully', () => {
    it('does not render spotlight when target element is missing', async () => {
      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.queryByTestId('spotlight-overlay')).not.toBeInTheDocument()
      })
    })

    it('does not render step card when target element is missing', async () => {
      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial-step-card')).not.toBeInTheDocument()
      })
    })

    it('recovers when element appears after initial render', async () => {
      render(<TutorialTestHarness />)

      useTutorialStore.getState().startTutorial(TEST_TUTORIAL)

      // Initially missing
      await waitFor(() => {
        expect(screen.queryByTestId('spotlight-overlay')).not.toBeInTheDocument()
      })

      // Add the element to the DOM
      const el = createTargetElement('step-one-element')
      targetElements.push(el)

      // Trigger a resize to recalculate positions
      window.dispatchEvent(new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('spotlight-overlay')).toBeInTheDocument()
      })
    })
  })
})
