import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
}

function parseMonth(month: string): [number, number] {
  const parts = month.split('-').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 1]
}

function formatMonthDisplay(month: string) {
  const [year, monthNum] = parseMonth(month)
  const date = new Date(year, monthNum - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function addMonths(month: string, delta: number) {
  const [year, monthNum] = parseMonth(month)
  const date = new Date(year, monthNum - 1 + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handlePrevious = () => onMonthChange(addMonths(selectedMonth, -1))
  const handleNext = () => onMonthChange(addMonths(selectedMonth, 1))

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevious} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[140px] text-center font-medium capitalize">
        {formatMonthDisplay(selectedMonth)}
      </span>
      <Button variant="outline" size="icon" onClick={handleNext} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
