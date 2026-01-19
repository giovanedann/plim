import { OnboardingOverlay } from '@/components/onboarding'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

export function AppLayout() {
  const { user } = useAuthStore()
  const { open } = useOnboardingStore()
  const [_profile, setProfile] = useState<{ onboarded: boolean } | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch profile to check onboarded status
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      try {
        const { data } = await supabase
          .from('profile')
          .select('onboarded')
          .eq('user_id', user.id)
          .single()

        setProfile(data)

        // Open onboarding if user hasn't completed it
        if (data && !data.onboarded) {
          open(false)
        }
      } catch {
        // Profile might not exist yet, open onboarding
        open(false)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [user, open])

  const handleSaveSalary = useCallback(
    async (salaryInCents: number) => {
      if (!user) return

      const now = new Date()
      const effectiveDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      await supabase.from('salary_history').upsert(
        {
          user_id: user.id,
          amount: salaryInCents,
          effective_date: effectiveDate,
        },
        { onConflict: 'user_id,effective_date' }
      )
    },
    [user]
  )

  const handleComplete = useCallback(async () => {
    if (!user) return

    await supabase.from('profile').update({ onboarded: true }).eq('user_id', user.id)

    setProfile((prev) => (prev ? { ...prev, onboarded: true } : null))
  }, [user])

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">MyFinances</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <Outlet />
      </main>

      {/* Onboarding overlay */}
      <OnboardingOverlay
        existingSalary={null}
        onSaveSalary={handleSaveSalary}
        onComplete={handleComplete}
      />
    </div>
  )
}
