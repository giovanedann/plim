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
  DollarSign,
  type LucideIcon,
  Minus,
  Pencil,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
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

interface ComparisonIndicatorProps {
  comparison: { value: number | null; label: string }
  positiveColor: string
  negativeColor: string
}

function ComparisonIndicator({
  comparison: comparisonData,
  positiveColor,
  negativeColor,
}: ComparisonIndicatorProps) {
  if (comparisonData.value !== null) {
    const isPositive = comparisonData.value > 0
    return (
      <div className="mt-1 flex items-center gap-1 text-xs">
        {isPositive ? (
          <ArrowUp className={`h-3 w-3 ${positiveColor}`} />
        ) : (
          <ArrowDown className={`h-3 w-3 ${negativeColor}`} />
        )}
        <span className={isPositive ? positiveColor : negativeColor}>{comparisonData.label}</span>
      </div>
    )
  }
  return (
    <div className="mt-1 flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">{comparisonData.label}</span>
    </div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  iconClassName: string
  label: string
  value: string
  valueClassName?: string
  comparison?: ComparisonData
  comparisonData?: { value: number | null; label: string }
  positiveColor?: string
  negativeColor?: string
  footer?: React.ReactNode
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName,
  comparison,
  comparisonData,
  positiveColor = 'text-emerald-500',
  negativeColor = 'text-red-500',
  footer,
}: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconClassName}`} />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <p className={`mt-2 text-2xl font-bold ${valueClassName ?? ''}`}>{value}</p>
        {comparison && comparisonData && (
          <ComparisonIndicator
            comparison={comparisonData}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
          />
        )}
        {footer}
      </CardContent>
    </Card>
  )
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
  const maskValue = (value: number) => (hideValues ? '••••••' : formatBRL(value))
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const hasIncomes = totalIncomes > 0

  const animatedSalary = useCountUp(salary?.amount_cents ?? 0)
  const animatedExpenses = useCountUp(totalExpenses)
  const animatedIncomes = useCountUp(totalIncomes)
  const animatedNetCost = useCountUp(netCost)
  const animatedBalance = useCountUp(balance)

  const expenseComparison = calculatePercentageChange(
    totalExpenses,
    comparison?.previousExpenses ?? null
  )
  const incomeComparison = calculatePercentageChange(
    totalIncomes,
    comparison?.previousIncomes ?? null
  )
  const netCostComparison = calculatePercentageChange(netCost, comparison?.previousNetCost ?? null)
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
  const savingsRate = hasSalary ? ((salary.amount_cents - netCost) / salary.amount_cents) * 100 : 0

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

  return (
    <div
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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

      <StatCard
        icon={TrendingDown}
        iconClassName="text-red-500"
        label="Despesas"
        value={maskValue(animatedExpenses)}
        valueClassName="text-red-500"
        comparison={comparison}
        comparisonData={expenseComparison}
        positiveColor="text-red-500"
        negativeColor="text-emerald-500"
      />

      {hasIncomes && (
        <StatCard
          icon={DollarSign}
          iconClassName="text-emerald-500"
          label="Receitas"
          value={maskValue(animatedIncomes)}
          valueClassName="text-emerald-500"
          comparison={comparison}
          comparisonData={incomeComparison}
          positiveColor="text-emerald-500"
          negativeColor="text-red-500"
        />
      )}

      {hasIncomes && (
        <StatCard
          icon={Minus}
          iconClassName="text-blue-500"
          label="Custo Líquido"
          value={maskValue(animatedNetCost)}
          valueClassName="text-blue-500"
          comparison={comparison}
          comparisonData={netCostComparison}
          positiveColor="text-red-500"
          negativeColor="text-emerald-500"
        />
      )}

      {hasSalary && (
        <StatCard
          icon={TrendingUp}
          iconClassName={balance >= 0 ? 'text-emerald-500' : 'text-red-500'}
          label="Saldo"
          value={maskValue(animatedBalance)}
          valueClassName={balance >= 0 ? 'text-emerald-500' : 'text-red-500'}
          comparison={comparison}
          comparisonData={balanceComparison}
          positiveColor="text-emerald-500"
          negativeColor="text-red-500"
        />
      )}

      {hasSalary && (
        <StatCard
          icon={PiggyBank}
          iconClassName={savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500'}
          label="Taxa de Economia"
          value={hideValues ? '••••••' : `${savingsRate.toFixed(1)}%`}
          valueClassName={savingsRate >= 0 ? 'text-emerald-500' : 'text-red-500'}
          footer={
            <div className="mt-1 text-xs text-muted-foreground">
              {savingsRate >= 20
                ? 'Excelente!'
                : savingsRate >= 10
                  ? 'Bom ritmo'
                  : savingsRate >= 0
                    ? 'Pode melhorar'
                    : 'Gastos acima do salário'}
            </div>
          }
        />
      )}
    </div>
  )
}
