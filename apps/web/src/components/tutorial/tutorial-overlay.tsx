import { useTutorialStore } from '@/stores'
import { Spotlight } from './spotlight'
import { TutorialStepCard } from './tutorial-step'

export function TutorialOverlay(): React.ReactNode {
  const activeTutorial = useTutorialStore((s) => s.activeTutorial)
  const currentStep = useTutorialStore((s) => s.currentStep)

  const step = activeTutorial?.steps[currentStep]

  if (!activeTutorial) return null

  return (
    <>
      <Spotlight elementId={step?.elementId} />
      <TutorialStepCard />
    </>
  )
}
