import { useSidebar } from '@/components/ui/sidebar'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useTutorialStore } from '@/stores'
import { useEffect, useRef } from 'react'
import { Spotlight } from './spotlight'
import { TutorialStepCard } from './tutorial-step'

function isSidebarElement(elementId: string): boolean {
  return elementId.startsWith('sidebar-nav-')
}

export function TutorialOverlay(): React.ReactNode {
  const tutorialsEnabled = useFeatureFlag('enable-tutorials', true)
  const activeTutorial = useTutorialStore((s) => s.activeTutorial)
  const currentStep = useTutorialStore((s) => s.currentStep)
  const exitTutorial = useTutorialStore((s) => s.exitTutorial)
  const { isMobile, setOpenMobile } = useSidebar()
  const prevStepRef = useRef<string | null>(null)

  const step = activeTutorial?.steps[currentStep]

  useEffect(() => {
    if (!tutorialsEnabled && activeTutorial) {
      exitTutorial()
    }
  }, [tutorialsEnabled, activeTutorial, exitTutorial])

  useEffect(() => {
    if (!step) {
      prevStepRef.current = null
      return
    }

    const prevElementId = prevStepRef.current
    prevStepRef.current = step.elementId

    if (isMobile) {
      if (isSidebarElement(step.elementId)) {
        setOpenMobile(true)
      } else if (prevElementId && isSidebarElement(prevElementId)) {
        setOpenMobile(false)
      }
    }
  }, [step, isMobile, setOpenMobile])

  if (!tutorialsEnabled || !activeTutorial) return null

  return (
    <>
      <Spotlight elementId={step?.elementId} />
      <TutorialStepCard />
    </>
  )
}
