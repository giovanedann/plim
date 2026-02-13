import { AppLayout } from '@/components/layouts/app'
import { useAuthStore } from '@/stores/auth.store'
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isInitialized) {
      return
    }
    if (!context.auth.user) {
      throw redirect({ to: '/sign-in' })
    }
  },
  pendingComponent: LoadingSpinner,
  component: AppLayoutWrapper,
})

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function AppLayoutWrapper() {
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate({ to: '/sign-in' })
    }
  }, [user, isInitialized, navigate])

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
