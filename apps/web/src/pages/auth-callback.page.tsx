import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hasExchangedCode = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      if (hasExchangedCode.current) return
      hasExchangedCode.current = true

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        console.error('Auth callback error:', error)
        navigate({ to: '/sign-in' })
      }
    }

    handleCallback()
  }, [navigate])

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
