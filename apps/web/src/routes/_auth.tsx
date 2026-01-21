import { AuthLayout } from '@/components/layouts/auth'
import { useAuthStore } from '@/stores/auth.store'
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    if (context.auth.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuthLayoutWrapper,
})

function AuthLayoutWrapper() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
