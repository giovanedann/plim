import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'

interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [viewYear, setViewYear] = useState(value.getFullYear())

  const selectedMonth = value.getMonth()
  const selectedYear = value.getFullYear()

  const handlePrevYear = () => setViewYear((y) => y - 1)
  const handleNextYear = () => setViewYear((y) => y + 1)

  const handleMonthSelect = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1))
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handlePrevYear}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{viewYear}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleNextYear}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((month, index) => {
          const isSelected = selectedMonth === index && selectedYear === viewYear
          return (
            <Button
              key={month}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-9', !isSelected && 'hover:bg-accent')}
              onClick={() => handleMonthSelect(index)}
              type="button"
            >
              {month.slice(0, 3)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
