import { SummaryCards } from '@/components/summary-cards'
import type { SummaryCardsData } from '@/components/summary-cards'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isErrorResponse } from '@/lib/api-client'
import { salaryService } from '@/services'
import { useUIStore } from '@/stores'
import { centsToDecimal, formatBRL, parseBRL } from '@plim/shared'
import type { SalaryHistory } from '@plim/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ComparisonData {
  previousExpenses: number | null
  previousIncomes: number | null
  previousNetCost: number | null
  previousBalance: number | null
}

interface SalaryDisplayProps {
  salary: SalaryHistory | null
  totalExpenses: number
  totalIncomes: number
  netCost: number
  balance: number
  selectedMonth: string
  isLoading: boolean
  comparison?: ComparisonData
}

export function SalaryDisplay({
  salary,
  totalExpenses,
  totalIncomes,
  netCost,
  balance,
  selectedMonth,
  isLoading,
  comparison,
}: SalaryDisplayProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const maskValue = (value: number): string => (hideValues ? '••••••' : formatBRL(value))
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const handleStartEdit = (): void => {
    const currentValue = salary?.amount_cents ?? 0
    setEditValue(centsToDecimal(currentValue).toFixed(2).replace('.', ','))
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = (): void => {
    setIsEditing(false)
    setEditValue('')
    setError(null)
  }

  const handleSave = async (): Promise<void> => {
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

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const hasSalary = salary && salary.amount_cents > 0
  const totalIncome = (salary?.amount_cents ?? 0) + totalIncomes
  const savingsRate = hasSalary ? ((salary.amount_cents - netCost) / salary.amount_cents) * 100 : 0

  const hasPreviousData =
    comparison !== undefined &&
    (comparison.previousExpenses !== null || comparison.previousBalance !== null)
  const previousTotalIncome = hasPreviousData
    ? (comparison.previousBalance ?? 0) + (comparison.previousExpenses ?? 0)
    : null

  const summaryData: SummaryCardsData = {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    previousIncome: previousTotalIncome,
    previousExpenses: hasPreviousData ? (comparison.previousExpenses ?? 0) : null,
    previousBalance: hasPreviousData ? (comparison.previousBalance ?? 0) : null,
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {['s1', 's2', 's3', 's4'].map((key) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const salaryCard = (
    <Card key="salary" className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
          <p className="mt-2 text-2xl font-bold">{maskValue(salary?.amount_cents ?? 0)}</p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div data-tutorial-id="expense-monthly-total">
      <SummaryCards
        data={summaryData}
        hideValues={hideValues}
        showIncomeCard={false}
        leadingCard={salaryCard}
      />
    </div>
  )
}
