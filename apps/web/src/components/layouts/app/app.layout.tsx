import { OnboardingOverlay } from '@/components/onboarding'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { profileService, salaryService } from '@/services'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

export function AppLayout() {
  const { user } = useAuthStore()
  const { open } = useOnboardingStore()
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">MyFinances</div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-6">
        <Outlet />
      </main>

      <OnboardingOverlay
        existingSalary={null}
        onSaveSalary={handleSaveSalary}
        onComplete={handleComplete}
      />
    </div>
  )
}
