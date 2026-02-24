import { AuthLayout } from '@/components/layouts/auth'
import { useAuthStore } from '@/stores/auth.store'
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    if (context.auth.user && !context.auth.isInRecoveryMode) {
      throw redirect({ to: '/home' })
    }
  },
  component: AuthLayoutWrapper,
})

function AuthLayoutWrapper() {
  const user = useAuthStore((state) => state.user)
  const isInRecoveryMode = useAuthStore((state) => state.isInRecoveryMode)
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !isInRecoveryMode) {
      navigate({ to: '/home' })
    }
  }, [user, isInRecoveryMode, navigate])

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
