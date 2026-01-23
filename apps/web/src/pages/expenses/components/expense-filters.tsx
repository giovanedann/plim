import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUIStore } from '@/stores'
import { EXPENSE_TYPES, PAYMENT_METHODS } from '@plim/shared'
import type {
  Category,
  EffectiveSpendingLimit,
  ExpenseFilters as ExpenseFiltersType,
} from '@plim/shared'
import { Eye, EyeOff, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { ExpenseModal } from './expense-modal'

interface ExpenseFiltersProps {
  filters: Omit<ExpenseFiltersType, 'start_date' | 'end_date'>
  onFiltersChange: (filters: Omit<ExpenseFiltersType, 'start_date' | 'end_date'>) => void
  categories: Category[]
  selectedMonth: string
  spendingLimit?: EffectiveSpendingLimit | null
  totalExpenses?: number
}

export function ExpenseFilters({
  filters,
  onFiltersChange,
  categories,
  selectedMonth,
  spendingLimit,
  totalExpenses,
}: ExpenseFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { hideValues, toggleHideValues } = useUIStore()

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category_id: value === 'all' ? undefined : value,
    })
  }

  const handlePaymentMethodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      payment_method: value === 'all' ? undefined : (value as ExpenseFiltersType['payment_method']),
    })
  }

  const handleExpenseTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      expense_type: value === 'all' ? undefined : (value as ExpenseFiltersType['expense_type']),
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.category_id || filters.payment_method || filters.expense_type

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <span className="text-sm font-medium">Filtros</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHideValues}
          aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid w-full grid-cols-1 gap-4 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={filters.category_id ?? 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pagamento</Label>
              <Select
                value={filters.payment_method ?? 'all'}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={filters.expense_type ?? 'all'} onValueChange={handleExpenseTypeChange}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </CardContent>

      <ExpenseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        selectedMonth={selectedMonth}
        spendingLimit={spendingLimit}
        totalExpenses={totalExpenses}
      />
    </Card>
  )
}
