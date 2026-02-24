import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscription } from '@/hooks/use-subscription'
import { analytics } from '@/lib/analytics'
import { isErrorResponse } from '@/lib/api-client'
import { paymentService } from '@/services/payment.service'
import type { PixPaymentResponse } from '@plim/shared'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  LayoutDashboard,
  QrCode,
  Sparkles,
  Tags,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PixPaymentDialog } from './components/pix-payment-dialog'

const PERKS = [
  { icon: Tags, text: 'Categorias ilimitadas' },
  { icon: CreditCard, text: 'Cartões de crédito ilimitados' },
  { icon: LayoutDashboard, text: 'Dashboard com mais gráficos, ranges e insights' },
  { icon: Sparkles, text: '100 requisições de texto com IA por semana' },
  { icon: Sparkles, text: '20 requisições de imagem com IA por semana' },
  { icon: Sparkles, text: '15 requisições de voz com IA por semana' },
]

function getElapsedPercent(periodStart: string | null, periodEnd: string | null): number {
  if (!periodStart || !periodEnd) return 0
  const start = new Date(periodStart).getTime()
  const end = new Date(periodEnd).getTime()
  const now = Date.now()
  const percent = ((now - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, percent))
}

export function UpgradePage(): React.JSX.Element {
  const { subscription, isPro, isExpiringSoon, daysRemaining, isLoading } = useSubscription()
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null)
  const [isPixDialogOpen, setIsPixDialogOpen] = useState(false)
  const [isCreatingPix, setIsCreatingPix] = useState(false)

  useEffect(() => {
    analytics.upgradePageViewed()
  }, [])

  const showProStatus = isPro && subscription?.mp_payment_status !== 'cancelled'
  const showFreeCard = !isPro || subscription?.mp_payment_status === 'cancelled'

  async function handlePixPayment(): Promise<void> {
    analytics.paymentInitiated()
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
        <div className="mx-auto w-full max-w-lg px-4 lg:px-6">
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Gerencie seu plano</p>
      </div>

      <div
        className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 lg:px-6"
        data-tutorial-id="upgrade-plan-card"
      >
        {showProStatus && (
          <>
            {isPro && isExpiringSoon && subscription?.payment_method === 'pix' && (
              <Card className="border-amber-500/50">
                <CardContent className="flex items-center gap-4 pt-6">
                  <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-medium">Seu plano expira em {daysRemaining} dias</p>
                    <p className="text-sm text-muted-foreground">
                      Renove com PIX para continuar com o Pro.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={isExpiringSoon ? 'border-amber-500/50' : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="size-5 text-amber-500" />
                  Plano Pro
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge className="w-fit border-emerald-500/50 bg-emerald-500/15 text-emerald-500">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Válido até</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {subscription?.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Pagamento</span>
                    <Badge variant="outline" className="w-fit">
                      <QrCode className="mr-1 size-3" />
                      PIX
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Dias restantes</span>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {daysRemaining ?? '-'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Período atual</span>
                    <span>
                      {Math.round(
                        getElapsedPercent(
                          subscription?.current_period_start ?? null,
                          subscription?.current_period_end ?? null
                        )
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={getElapsedPercent(
                      subscription?.current_period_start ?? null,
                      subscription?.current_period_end ?? null
                    )}
                    className="h-2"
                  />
                </div>

                <Button onClick={handlePixPayment} disabled={isCreatingPix} className="w-full">
                  {isCreatingPix ? 'Gerando QR Code...' : 'Renovar assinatura'}
                </Button>

                <Card className="bg-muted/50">
                  <CardContent className="pt-4 pb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Seus benefícios
                    </p>
                    <ul className="space-y-1.5">
                      {PERKS.map((perk) => (
                        <li
                          key={perk.text}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                          {perk.text}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </>
        )}

        {showFreeCard && (
          <Card>
            <CardHeader className="items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/15">
                <Crown className="size-6 text-amber-500" />
              </div>
              <CardTitle className="mt-2">Plano Pro</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="text-center">
                <p className="text-3xl font-bold">R$ 24,90</p>
                <p className="text-sm text-muted-foreground">/ 30 dias</p>
                <p className="mt-1 text-xs text-muted-foreground">Pagamento único via PIX</p>
              </div>

              <ul className="space-y-3">
                {PERKS.map((perk) => (
                  <li key={perk.text} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    {perk.text}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handlePixPayment}
                disabled={isCreatingPix}
                className="w-full"
                data-tutorial-id="upgrade-payment-button"
              >
                <QrCode className="mr-2 size-4" />
                {isCreatingPix ? 'Gerando QR Code...' : 'Pagar com PIX'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <PixPaymentDialog
        open={isPixDialogOpen}
        onOpenChange={setIsPixDialogOpen}
        pixData={pixData}
      />
    </div>
  )
}
