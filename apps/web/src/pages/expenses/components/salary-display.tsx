import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCountUp } from '@/hooks/use-count-up'
import { isErrorResponse } from '@/lib/api-client'
import { salaryService } from '@/services'
import { useUIStore } from '@/stores'
import { centsToDecimal, formatBRL, parseBRL } from '@plim/shared'
import type { SalaryHistory } from '@plim/shared'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ComparisonData {
  previousExpenses: number | null
  previousBalance: number | null
}

interface SalaryDisplayProps {
  salary: SalaryHistory | null
  totalExpenses: number
  balance: number
  selectedMonth: string
  isLoading: boolean
  comparison?: ComparisonData
}

function calculatePercentageChange(
  current: number,
  previous: number | null
): { value: number | null; label: string } {
  if (previous === null) {
    return { value: null, label: 'Primeiro mês registrado' }
  }
  if (previous === 0) {
    return { value: null, label: 'N/A' }
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  return { value: change, label: `${Math.abs(change).toFixed(1)}% vs mês anterior` }
}

export function SalaryDisplay({
  salary,
  totalExpenses,
  balance,
  selectedMonth,
  isLoading,
  comparison,
}: SalaryDisplayProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const maskValue = (value: number) => (hideValues ? '••••••' : formatBRL(value))
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Animated values
  const animatedSalary = useCountUp(salary?.amount_cents ?? 0)
  const animatedExpenses = useCountUp(totalExpenses)
  const animatedBalance = useCountUp(balance)

  // Comparison calculations
  const expenseComparison = calculatePercentageChange(
    totalExpenses,
    comparison?.previousExpenses ?? null
  )
  const balanceComparison = calculatePercentageChange(balance, comparison?.previousBalance ?? null)

  const handleStartEdit = () => {
    const currentValue = salary?.amount_cents ?? 0
    setEditValue(centsToDecimal(currentValue).toFixed(2).replace('.', ','))
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
    setError(null)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const amountCents = parseBRL(editValue)
      const parts = selectedMonth.split('-').map(Number)
      const year = parts[0] ?? 0
      const month = parts[1] ?? 1
      const effectiveFrom = `${year}-${String(month).padStart(2, '0')}-01`

      const response = await salaryService.createSalary({
        amount_cents: amountCents,
        effective_from: effectiveFrom,
      })

      if (isErrorResponse(response)) {
        const errorMsg = response.error.message || 'Erro ao salvar salário'
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }

      await queryClient.invalidateQueries({ queryKey: ['salary', selectedMonth] })
      toast.success('Salário atualizado com sucesso!')
      setIsEditing(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar salário'
      setError(errorMsg)
      toast.error(errorMsg)
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

  const hasSalary = salary && salary.amount_cents > 0

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${hasSalary ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
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

  return (
    <div
      className={`grid gap-4 ${hasSalary ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
      data-tutorial-id="expense-monthly-total"
    >
      <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
            <div className="mt-2 space-y-2">
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
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          ) : (
            <p className="mt-2 text-2xl font-bold">{maskValue(animatedSalary)}</p>
          )}
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">Total de Despesas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-500">{maskValue(animatedExpenses)}</p>
          {comparison && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {expenseComparison.value !== null ? (
                <>
                  {expenseComparison.value > 0 ? (
                    <ArrowUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-emerald-500" />
                  )}
                  <span
                    className={expenseComparison.value > 0 ? 'text-red-500' : 'text-emerald-500'}
                  >
                    {expenseComparison.label}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{expenseComparison.label}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {hasSalary && (
        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
              {maskValue(animatedBalance)}
            </p>
            {comparison && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {balanceComparison.value !== null ? (
                  <>
                    {balanceComparison.value > 0 ? (
                      <ArrowUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={balanceComparison.value > 0 ? 'text-emerald-500' : 'text-red-500'}
                    >
                      {balanceComparison.label}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{balanceComparison.label}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
