import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscription } from '@/hooks/use-subscription'
import { isErrorResponse } from '@/lib/api-client'
import { paymentService } from '@/services/payment.service'
import type { PixPaymentResponse } from '@plim/shared'
import { AlertTriangle, Crown, QrCode } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PixPaymentDialog } from './components/pix-payment-dialog'

export function UpgradePage() {
  const { subscription, isPro, isExpiringSoon, daysRemaining, isLoading } = useSubscription()
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null)
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false)
  const [isCreatingPix, setIsCreatingPix] = useState(false)

  async function handlePixPayment(): Promise<void> {
    setIsCreatingPix(true)
    const response = await paymentService.createPixPayment()
    setIsCreatingPix(false)

    if (isErrorResponse(response)) {
      toast.error(response.error.message)
      return
    }

    setPixData(response.data)
    setIsPixDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="mx-auto max-w-lg px-4 lg:px-6">
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Gerencie seu plano</p>
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 lg:px-6">
        {/* Expiring PIX renewal banner */}
        {isPro && isExpiringSoon && subscription?.payment_method === 'pix' && (
          <Card className="border-amber-500/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Seu plano expira em {daysRemaining} dias</p>
                <p className="text-sm text-muted-foreground">
                  Renove com PIX para continuar com o Pro.
                </p>
              </div>
              <Button onClick={handlePixPayment} disabled={isCreatingPix} size="sm">
                {isCreatingPix ? 'Gerando...' : 'Renovar'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pro user current plan info */}
        {isPro && subscription?.mp_payment_status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Plano Pro
              </CardTitle>
              <CardDescription>
                Ativo ate{' '}
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                  : '-'}
                {daysRemaining !== null && ` (${daysRemaining} dias restantes)`}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Payment options for free users or cancelled Pro users */}
        {(!isPro || subscription?.mp_payment_status === 'cancelled') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                PIX
              </CardTitle>
              <CardDescription>Pagamento unico, sem renovacao automatica</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-3xl font-bold">R$ 24,90</p>
                <p className="text-sm text-muted-foreground">por 30 dias</p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>100 requisicoes de texto por semana</li>
                <li>20 requisicoes de imagem por semana</li>
                <li>15 requisicoes de voz por semana</li>
              </ul>
              <Button onClick={handlePixPayment} disabled={isCreatingPix} className="w-full">
                {isCreatingPix ? 'Gerando QR Code...' : 'Pagar com PIX'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PIX QR Code Dialog */}
      <PixPaymentDialog
        open={isPixDialogOpen}
        onOpenChange={setIsPixDialogOpen}
        pixData={pixData}
      />
    </div>
  )
}
