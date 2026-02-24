import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { spendingLimitService } from '@/services'
import { useUIStore } from '@/stores'
import { centsToDecimal, formatBRL, parseBRL } from '@plim/shared'
import type { EffectiveSpendingLimit } from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Pencil, Target, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SpendingLimitCardProps {
  spendingLimit: EffectiveSpendingLimit | null
  netCost: number
  selectedMonth: string
  isLoading: boolean
}

function getThresholdStatus(percentage: number) {
  if (percentage >= 100) {
    return {
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      label: 'Limite excedido',
      severity: 'exceeded' as const,
    }
  }
  if (percentage >= 90) {
    return {
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      label: 'Alerta',
      severity: 'high' as const,
    }
  }
  if (percentage >= 75) {
    return {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      label: 'Atenção',
      severity: 'medium' as const,
    }
  }
  return {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    label: 'Dentro do limite',
    severity: 'low' as const,
  }
}

export function SpendingLimitCard({
  spendingLimit,
  netCost,
  selectedMonth,
  isLoading,
}: SpendingLimitCardProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const maskValue = (value: number) => (hideValues ? '••••••' : formatBRL(value))
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const queryClient = useQueryClient()

  const upsertMutation = useMutation({
    mutationFn: (amountCents: number) =>
      spendingLimitService.upsertSpendingLimit({
        year_month: selectedMonth,
        amount_cents: amountCents,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spending-limit', selectedMonth] })
      toast.success('Limite atualizado com sucesso!')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar limite')
    },
  })

  const handleStartEdit = () => {
    const currentValue = spendingLimit?.amount_cents ?? 0
    setEditValue(currentValue > 0 ? centsToDecimal(currentValue).toFixed(2).replace('.', ',') : '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = () => {
    const amountCents = parseBRL(editValue)
    if (amountCents <= 0) {
      toast.error('O limite deve ser maior que zero')
      return
    }
    upsertMutation.mutate(amountCents)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-24 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  // No limit set state
  if (!spendingLimit) {
    return (
      <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Definir limite mensal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                    placeholder="0,00"
                    autoFocus
                    disabled={upsertMutation.isPending}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                  aria-label="Salvar"
                >
                  <Check className="h-4 w-4 text-emerald-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCancelEdit}
                  disabled={upsertMutation.isPending}
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5" />
                <span className="text-sm font-medium">Nenhum limite definido</span>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Defina um limite mensal para controlar seus gastos
              </p>
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                Definir limite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Calculate percentage and status using netCost (expenses minus incomes)
  const effectiveNetCost = Math.max(0, netCost)
  const percentage = Math.round((effectiveNetCost / spendingLimit.amount_cents) * 100)
  const remaining = spendingLimit.amount_cents - effectiveNetCost
  const status = getThresholdStatus(percentage)

  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${status.color}`} />
            <span className="text-sm font-medium text-muted-foreground">Limite de Gastos</span>
            {spendingLimit.is_carried_over && (
              <span className="text-xs text-muted-foreground">
                (herdado de {spendingLimit.source_month})
              </span>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleStartEdit}
              aria-label="Editar limite"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  placeholder="0,00"
                  autoFocus
                  disabled={upsertMutation.isPending}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={upsertMutation.isPending}
                aria-label="Salvar"
              >
                <Check className="h-4 w-4 text-emerald-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelEdit}
                disabled={upsertMutation.isPending}
                aria-label="Cancelar"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={status.color}>{maskValue(effectiveNetCost)}</span>
                <span className="text-muted-foreground">
                  de {maskValue(spendingLimit.amount_cents)}
                </span>
              </div>
              <Progress value={Math.min(percentage, 100)} className={`h-2 ${status.bgColor}`} />
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {status.severity !== 'low' && (
                    <AlertTriangle className={`h-3 w-3 ${status.color}`} />
                  )}
                  <span className={status.color}>
                    {percentage}% utilizado
                    {status.severity !== 'low' && ` · ${status.label}`}
                  </span>
                </div>
                <span className={remaining >= 0 ? 'text-muted-foreground' : 'text-red-500'}>
                  {remaining >= 0
                    ? `Restam ${maskValue(remaining)}`
                    : `Excedido em ${maskValue(Math.abs(remaining))}`}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
