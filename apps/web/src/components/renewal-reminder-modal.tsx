import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSubscription } from '@/hooks/use-subscription'
import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Crown, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'plim:dismiss-renewal-modal'

interface DismissState {
  type: 'expiring-soon' | 'expired'
  dismissedAt: number
}

function getDismissState(): DismissState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DismissState
  } catch {
    return null
  }
}

function saveDismissState(type: 'expiring-soon' | 'expired'): void {
  const state: DismissState = { type, dismissedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function RenewalReminderModal(): React.JSX.Element | null {
  const { isPro, isExpiringSoon, daysRemaining } = useSubscription()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sessionDismissed, setSessionDismissed] = useState(false)

  const isExpired = isPro && daysRemaining === 0
  const shouldShow = isPro && (isExpiringSoon || isExpired)

  useEffect(() => {
    if (!shouldShow || sessionDismissed) return

    const dismissState = getDismissState()
    if (dismissState) {
      if (isExpired && dismissState.type === 'expiring-soon') {
        setOpen(true)
        return
      }
      if (isExpired && dismissState.type === 'expired') return
      if (!isExpired && dismissState.type === 'expiring-soon') return
    }

    setOpen(true)
  }, [shouldShow, isExpired, sessionDismissed])

  if (!shouldShow) return null

  const currentType: 'expiring-soon' | 'expired' = isExpired ? 'expired' : 'expiring-soon'

  function handleRenewNow(): void {
    setOpen(false)
    navigate({ to: '/upgrade' })
  }

  function handleRemindLater(): void {
    setOpen(false)
    setSessionDismissed(true)
  }

  function handleDismissPermanently(): void {
    saveDismissState(currentType)
    setOpen(false)
    setSessionDismissed(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            {isExpired ? (
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
                <XCircle className="size-6 text-destructive" />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/15">
                <AlertTriangle className="size-6 text-amber-500" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center">
            {isExpired ? 'Seu plano Pro expirou' : `Seu plano Pro expira em ${daysRemaining} dias`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isExpired
              ? 'Renove agora para continuar usando os recursos Pro.'
              : 'Renove antes do vencimento para não perder seus benefícios.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleRenewNow} className="w-full">
            <Crown className="mr-2 size-4" />
            Renovar agora
          </Button>
          <Button variant="outline" onClick={handleRemindLater} className="w-full">
            Me lembre depois
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismissPermanently}
            className="w-full text-muted-foreground"
          >
            Não quero mais ver isso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
