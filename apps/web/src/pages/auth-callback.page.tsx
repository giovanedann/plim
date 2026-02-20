import { isErrorResponse } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import { referralService } from '@/services/referral.service'
import { useAuthStore } from '@/stores/auth.store'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const REFERRAL_STORAGE_KEY = 'plim_referral_code'

async function claimPendingReferral(): Promise<void> {
  const code = localStorage.getItem(REFERRAL_STORAGE_KEY)
  if (!code) return

  try {
    const result = await referralService.claimReferral(code)
    if (!isErrorResponse(result)) {
      toast.success('Voce ganhou 7 dias de Pro gratis!')
    }
  } catch {
    // Silently ignore claim errors
  } finally {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
  }
}

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
      claimPendingReferral().then(() => {
        navigate({ to: '/dashboard' })
      })
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
