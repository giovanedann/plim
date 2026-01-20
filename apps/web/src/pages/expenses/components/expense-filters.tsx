import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category, ExpenseFilters as ExpenseFiltersType } from '@myfinances/shared'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { ExpenseModal } from './expense-modal'

interface ExpenseFiltersProps {
  filters: Omit<ExpenseFiltersType, 'start_date' | 'end_date'>
  onFiltersChange: (filters: Omit<ExpenseFiltersType, 'start_date' | 'end_date'>) => void
  categories: Category[]
  selectedMonth: string
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
] as const

export function ExpenseFilters({
  filters,
  onFiltersChange,
  categories,
  selectedMonth,
}: ExpenseFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = filters.category_id || filters.payment_method

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Select value={filters.category_id ?? 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.payment_method ?? 'all'} onValueChange={handlePaymentMethodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as formas</SelectItem>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      <Button onClick={() => setIsModalOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Nova Despesa
      </Button>

      <ExpenseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        selectedMonth={selectedMonth}
      />
    </div>
  )
}
