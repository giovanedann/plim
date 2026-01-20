import { Button } from '@/components/ui/button'
import { MonthPicker } from '@/components/ui/month-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

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

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [open, setOpen] = useState(false)
  const handlePrevious = () => onMonthChange(addMonths(selectedMonth, -1))
  const handleNext = () => onMonthChange(addMonths(selectedMonth, 1))

  const handleMonthSelect = (date: Date) => {
    onMonthChange(dateToMonth(date))
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevious} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[160px] justify-center gap-2 font-medium">
            <CalendarIcon className="h-4 w-4" />
            <span className="capitalize">{formatMonthDisplay(selectedMonth)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <MonthPicker value={monthToDate(selectedMonth)} onChange={handleMonthSelect} />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={handleNext} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
