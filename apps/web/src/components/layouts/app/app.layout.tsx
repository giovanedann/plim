import { OnboardingOverlay } from '@/components/onboarding'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { profileService, salaryService } from '@/services'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
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
  const { user } = useAuthStore()
  const { open } = useOnboardingStore()
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname]

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      const { data, error } = await profileService.getProfile()

      if (error || !data) {
        open(false)
      } else if (!data.is_onboarded) {
        open(false)
      }

      setIsLoadingProfile(false)
    }

    fetchProfile()
  }, [user, open])

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
