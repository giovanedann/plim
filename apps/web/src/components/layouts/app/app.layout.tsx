import { OnboardingOverlay } from '@/components/onboarding'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useProfile } from '@/hooks/use-profile'
import { profileService, salaryService } from '@/services'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { AppSidebar } from './app-sidebar'
import { SiteHeader } from './site-header'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Despesas',
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { open } = useOnboardingStore()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname]

  useEffect(() => {
    if (isLoadingProfile) return

    if (!profile || !profile.is_onboarded) {
      open(false)
    }
  }, [profile, isLoadingProfile, open])

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
    </SidebarProvider>
  )
}
