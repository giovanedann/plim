import { useAuthStore } from '@/stores/auth.store'
import { Navigate, Outlet } from 'react-router'

export function GuestGuard() {
  const { user, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
