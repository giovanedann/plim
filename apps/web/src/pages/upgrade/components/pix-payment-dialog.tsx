import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSubscription } from '@/hooks/use-subscription'
import type { PixPaymentResponse } from '@plim/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Copy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface PixPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pixData: PixPaymentResponse | null
}

export function PixPaymentDialog({ open, onOpenChange, pixData }: PixPaymentDialogProps) {
  const queryClient = useQueryClient()
  const { isPro } = useSubscription()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    pollRef.current = null
    timerRef.current = null
  }, [])

  useEffect(() => {
    if (!open || !pixData) {
      cleanup()
      setIsApproved(false)
      return
    }

    // Poll subscription status every 5 seconds
    pollRef.current = setInterval(async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
    }, 5000)

    // Countdown timer
    const expiresAt = new Date(pixData.expires_at).getTime()
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const diff = expiresAt - now
      if (diff <= 0) {
        setTimeLeft('Expirado')
        cleanup()
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }, 1000)

    return cleanup
  }, [open, pixData, queryClient, cleanup])

  // Detect when payment is approved
  useEffect(() => {
    if (isPro && open && !isApproved) {
      setIsApproved(true)
      cleanup()
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] })
      toast.success('Pagamento confirmado! Voce agora e Pro.')
    }
  }, [isPro, open, isApproved, cleanup, queryClient])

  async function handleCopy(): Promise<void> {
    if (!pixData) return
    await navigator.clipboard.writeText(pixData.pix_copia_cola)
    setCopied(true)
    toast.success('Codigo copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pixData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-x-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isApproved ? 'Pagamento confirmado!' : 'Pagar com PIX'}</DialogTitle>
          <DialogDescription>
            {isApproved
              ? 'Seu plano Pro esta ativo.'
              : 'Escaneie o QR Code ou copie o codigo abaixo.'}
          </DialogDescription>
        </DialogHeader>

        {isApproved ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Aproveite os limites expandidos de IA!
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 overflow-hidden">
            {/* QR Code */}
            <div className="rounded-lg bg-white p-4">
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="h-48 w-48"
              />
            </div>

            {/* Countdown */}
            <p className="text-sm text-muted-foreground">Expira em: {timeLeft}</p>

            {/* Copy code */}
            <div className="flex w-full gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                {pixData.pix_copia_cola}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">Aguardando pagamento...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
