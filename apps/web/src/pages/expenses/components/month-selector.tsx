import { Button } from '@/components/ui/button'
import { MonthPicker } from '@/components/ui/month-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

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
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' })
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}/${year}`
}

function addMonths(month: string, delta: number) {
  const [year, monthNum] = parseMonth(month)
  const date = new Date(year, monthNum - 1 + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthToDate(month: string): Date {
  const [year, monthNum] = parseMonth(month)
  return new Date(year, monthNum - 1, 1)
}

function dateToMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const DEBOUNCE_MS = 300
const YEARS_RANGE = 2

function getDateBounds(): { minDate: Date; maxDate: Date } {
  const today = new Date()
  const minDate = new Date(today.getFullYear() - YEARS_RANGE, today.getMonth(), 1)
  const maxDate = new Date(today.getFullYear() + YEARS_RANGE, today.getMonth(), 1)
  return { minDate, maxDate }
}

function isMonthInRange(month: string, minDate: Date, maxDate: Date): boolean {
  const date = monthToDate(month)
  return date >= minDate && date <= maxDate
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { minDate, maxDate } = getDateBounds()

  const debouncedMonthChange = useCallback(
    (month: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onMonthChange(month)
      }, DEBOUNCE_MS)
    },
    [onMonthChange]
  )

  const prevMonth = addMonths(selectedMonth, -1)
  const nextMonth = addMonths(selectedMonth, 1)
  const canGoPrevious = isMonthInRange(prevMonth, minDate, maxDate)
  const canGoNext = isMonthInRange(nextMonth, minDate, maxDate)

  const handlePrevious = () => {
    if (canGoPrevious) {
      debouncedMonthChange(prevMonth)
    }
  }
  const handleNext = () => {
    if (canGoNext) {
      debouncedMonthChange(nextMonth)
    }
  }

  const handleMonthSelect = (date: Date) => {
    onMonthChange(dateToMonth(date))
    setOpen(false)
  }

  return (
    <div className="flex w-full sm:w-auto items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={handlePrevious}
        aria-label="Mês anterior"
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none min-w-[160px] justify-center gap-2 font-medium"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="capitalize">{formatMonthDisplay(selectedMonth)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <MonthPicker
            value={monthToDate(selectedMonth)}
            onChange={handleMonthSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={handleNext}
        aria-label="Próximo mês"
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
