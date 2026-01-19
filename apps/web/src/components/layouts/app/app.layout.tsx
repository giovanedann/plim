import { OnboardingOverlay } from '@/components/onboarding'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { api } from '@/lib/api-client'
import type { Profile } from '@/lib/api-types'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

export function AppLayout() {
  const { user } = useAuthStore()
  const { open } = useOnboardingStore()
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch profile to check onboarded status
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      const { data, error } = await api.get<Profile>('/profile')

      if (error || !data) {
        // Profile might not exist yet or error occurred, show onboarding
        open(false)
      } else if (!data.onboarded) {
        // User hasn't completed onboarding
        open(false)
      }

      setIsLoadingProfile(false)
    }

    fetchProfile()
  }, [user, open])

  const handleSaveSalary = useCallback(async (salaryInCents: number) => {
    const now = new Date()
    const effectiveDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    await api.post('/salary', {
      amount: salaryInCents,
      effective_date: effectiveDate,
    })
  }, [])

  const handleComplete = useCallback(async () => {
    await api.patch('/profile', { onboarded: true })
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
