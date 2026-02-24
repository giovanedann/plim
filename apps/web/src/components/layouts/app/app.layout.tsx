import { AIChatButton, AIChatDrawer } from '@/components/ai'
import { OnboardingOverlay } from '@/components/onboarding'
import { RenewalReminderModal } from '@/components/renewal-reminder-modal'
import { TutorialOverlay } from '@/components/tutorial/tutorial-overlay'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAIUsage } from '@/hooks/use-ai-usage'
import { useProfile } from '@/hooks/use-profile'
import { profileService, salaryService } from '@/services'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { SiteHeader } from './site-header'

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Início',
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { open, isOpen } = useOnboardingStore()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const location = useLocation()

  useAIUsage()

  const pageTitle = PAGE_TITLES[location.pathname]

  useEffect(() => {
    if (isLoadingProfile || !profile) return
    if (isOpen) return

    if (profile.is_onboarded === false) {
      open(false)
    }
  }, [profile, isLoadingProfile, isOpen, open])

  const handleSaveSalary = useCallback(async (salaryInCents: number) => {
    await salaryService.createCurrentMonthSalary(salaryInCents)
  }, [])

  const handleComplete = useCallback(async () => {
    await profileService.markOnboarded()
  }, [])

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title={pageTitle} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>

      <OnboardingOverlay
        existingSalary={null}
        onSaveSalary={handleSaveSalary}
        onComplete={handleComplete}
      />

      <RenewalReminderModal />

      <AIChatButton />
      <AIChatDrawer />

      <TutorialOverlay />
    </SidebarProvider>
  )
}
