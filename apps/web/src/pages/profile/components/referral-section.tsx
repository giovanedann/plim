import { Check, Copy, Gift, Share2, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useReferralStats } from '@/hooks/use-referral-stats'
import { analytics } from '@/lib/analytics'

function ReferralSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ReferralSection(): React.ReactElement {
  const { stats, isLoading } = useReferralStats()
  const [hasCopied, setHasCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    if (!stats?.referral_url) return

    try {
      await navigator.clipboard.writeText(stats.referral_url)
      setHasCopied(true)
      analytics.referralLinkCopied()
      toast.success('Link copiado!')
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar link')
    }
  }

  function handleWhatsAppShare(): void {
    if (!stats?.referral_url) return

    const message = `Conhece o Plim? Use meu link e ganhe 7 dias de Pro grátis: ${stats.referral_url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    analytics.referralLinkShared('whatsapp')
  }

  async function handleNativeShare(): Promise<void> {
    if (!stats?.referral_url) return

    try {
      await navigator.share({
        title: 'Plim - Convite',
        text: 'Conhece o Plim? Use meu link e ganhe 7 dias de Pro grátis.',
        url: stats.referral_url,
      })
      analytics.referralLinkShared('native')
    } catch {
      // User cancelled or share failed silently
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Indique e Ganhe
        </CardTitle>
        <CardDescription>Convide amigos e ganhe 7 dias de Pro para cada indicação</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ReferralSkeleton />
        ) : !stats ? (
          <p className="text-center text-muted-foreground">Erro ao carregar dados de indicação</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="referral-url">
                Seu link de indicação
              </label>
              <div className="flex gap-2">
                <Input
                  id="referral-url"
                  value={stats.referral_url}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar link">
                  {hasCopied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleWhatsAppShare} className="gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
              {typeof navigator !== 'undefined' && navigator.share !== undefined && (
                <Button variant="outline" onClick={handleNativeShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.total_referrals}</p>
                </div>
                <p className="text-sm text-muted-foreground">Indicações</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.total_pro_days_earned}</p>
                </div>
                <p className="text-sm text-muted-foreground">Dias Pro ganhos</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Indicações recentes</h4>
              {stats.referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Compartilhe seu link e ganhe Pro grátis!
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Lista de indicações">
                  {stats.referrals.map((referral) => (
                    <li
                      key={referral.created_at}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {referral.referred_name ?? 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(referral.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
