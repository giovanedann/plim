import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UseInstallPromptReturn {
  canPrompt: boolean
  isInstalled: boolean
  isIOS: boolean
  promptInstall: () => Promise<void>
}

function getIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

function getIsInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canPrompt, setCanPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(getIsInstalled)
  const isIOS = getIsIOS()

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event): void {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanPrompt(true)
    }

    function handleAppInstalled(): void {
      deferredPromptRef.current = null
      setCanPrompt(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent): void => {
      setIsInstalled(e.matches)
    }
    displayModeQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      displayModeQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<void> => {
    const prompt = deferredPromptRef.current
    if (!prompt) return

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === 'accepted') {
      deferredPromptRef.current = null
      setCanPrompt(false)
    }
  }, [])

  return { canPrompt, isInstalled, isIOS, promptInstall }
}
