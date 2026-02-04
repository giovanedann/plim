import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from './button'

interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
  minDate?: Date
  maxDate?: Date
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

export function MonthPicker({ value, onChange, className, minDate, maxDate }: MonthPickerProps) {
  const [viewYear, setViewYear] = useState(value.getFullYear())

  const selectedMonth = value.getMonth()
  const selectedYear = value.getFullYear()

  const minYear = minDate?.getFullYear()
  const maxYear = maxDate?.getFullYear()
  const minMonth = minDate ? minDate.getFullYear() * 12 + minDate.getMonth() : undefined
  const maxMonth = maxDate ? maxDate.getFullYear() * 12 + maxDate.getMonth() : undefined

  const canGoPrevYear = minYear === undefined || viewYear > minYear
  const canGoNextYear = maxYear === undefined || viewYear < maxYear

  const handlePrevYear = () => {
    if (canGoPrevYear) {
      setViewYear((y) => y - 1)
    }
  }
  const handleNextYear = () => {
    if (canGoNextYear) {
      setViewYear((y) => y + 1)
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1))
  }

  const isMonthDisabled = (monthIndex: number): boolean => {
    const targetMonth = viewYear * 12 + monthIndex
    if (minMonth !== undefined && targetMonth < minMonth) return true
    if (maxMonth !== undefined && targetMonth > maxMonth) return true
    return false
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
          disabled={!canGoPrevYear}
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
          disabled={!canGoNextYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((month, index) => {
          const isSelected = selectedMonth === index && selectedYear === viewYear
          const isDisabled = isMonthDisabled(index)
          return (
            <Button
              key={month}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-9', !isSelected && !isDisabled && 'hover:bg-accent')}
              onClick={() => handleMonthSelect(index)}
              type="button"
              disabled={isDisabled}
            >
              {month.slice(0, 3)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
