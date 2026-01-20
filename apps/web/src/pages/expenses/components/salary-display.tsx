import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { salaryService } from '@/services'
import { centsToDecimal, formatBRL, parseBRL } from '@myfinances/shared'
import type { SalaryHistory } from '@myfinances/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { useState } from 'react'

interface SalaryDisplayProps {
  salary: SalaryHistory | null
  totalExpenses: number
  balance: number
  selectedMonth: string
  isLoading: boolean
}

export function SalaryDisplay({
  salary,
  totalExpenses,
  balance,
  selectedMonth,
  isLoading,
}: SalaryDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const queryClient = useQueryClient()

  const handleStartEdit = () => {
    const currentValue = salary?.amount_cents ?? 0
    setEditValue(centsToDecimal(currentValue).toFixed(2).replace('.', ','))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const amountCents = parseBRL(editValue)
      const parts = selectedMonth.split('-').map(Number)
      const year = parts[0] ?? 0
      const month = parts[1] ?? 1
      const effectiveFrom = new Date(year, month - 1, 1).toISOString().split('T')[0] as string

      await salaryService.createSalary({
        amount_cents: amountCents,
        effective_from: effectiveFrom,
      })

      await queryClient.invalidateQueries({ queryKey: ['salary', selectedMonth] })
      setIsEditing(false)
    } catch {
      // Error handling via React Query
    } finally {
      setIsSaving(false)
    }
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
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const salaryAmount = salary?.amount_cents ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Salário</span>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleStartEdit}
                aria-label="Editar salário"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2 flex items-center gap-2">
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
                  disabled={isSaving}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Salvar"
              >
                <Check className="h-4 w-4 text-emerald-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCancelEdit}
                disabled={isSaving}
                aria-label="Cancelar"
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-2xl font-bold">{formatBRL(salaryAmount)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">Total de Despesas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-500">{formatBRL(totalExpenses)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingUp
              className={`h-5 w-5 ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
            />
            <span className="text-sm font-medium text-muted-foreground">Saldo</span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {formatBRL(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
