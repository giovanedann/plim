import { cn } from '@/lib/utils'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { DayPicker, type MonthCaptionProps } from 'react-day-picker'
import { Button } from './button'

type ViewMode = 'days' | 'months' | 'years'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function MonthYearSelector({
  displayMonth,
  onMonthChange,
  viewMode,
  setViewMode,
}: {
  displayMonth: Date
  onMonthChange: (date: Date) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}) {
  const currentYear = displayMonth.getFullYear()
  const currentMonth = displayMonth.getMonth()

  if (viewMode === 'months') {
    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMonthChange(new Date(currentYear - 1, currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setViewMode('years')}
            className="text-sm font-medium hover:underline"
          >
            {currentYear}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMonthChange(new Date(currentYear + 1, currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => (
            <Button
              key={month}
              variant={index === currentMonth ? 'default' : 'ghost'}
              size="sm"
              className="h-9"
              onClick={() => {
                onMonthChange(new Date(currentYear, index, 1))
                setViewMode('days')
              }}
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (viewMode === 'years') {
    const startYear = currentYear - 5
    const years = Array.from({ length: 12 }, (_, i) => startYear + i)

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMonthChange(new Date(currentYear - 12, currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {startYear} - {startYear + 11}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMonthChange(new Date(currentYear + 12, currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <Button
              key={year}
              variant={year === currentYear ? 'default' : 'ghost'}
              size="sm"
              className="h-9"
              onClick={() => {
                onMonthChange(new Date(year, currentMonth, 1))
                setViewMode('months')
              }}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return null
}

function CustomMonthCaption({
  calendarMonth,
  setViewMode,
}: MonthCaptionProps & { setViewMode: (mode: ViewMode) => void }) {
  const displayMonth = calendarMonth.date
  const monthName = displayMonth.toLocaleDateString('pt-BR', { month: 'long' })
  const year = displayMonth.getFullYear()
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <div className="flex justify-center relative items-center w-full h-7">
      <button
        type="button"
        onClick={() => setViewMode('months')}
        className="text-sm font-medium hover:underline z-0"
      >
        {capitalizedMonth} {year}
      </button>
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [month, setMonth] = useState<Date>(props.defaultMonth ?? new Date())

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth)
    if (props.onMonthChange) {
      props.onMonthChange(newMonth)
    }
  }

  if (viewMode !== 'days') {
    return (
      <div className={cn('p-0', className)}>
        <MonthYearSelector
          displayMonth={month}
          onMonthChange={handleMonthChange}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    )
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      locale={ptBR}
      month={month}
      onMonthChange={handleMonthChange}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center relative items-center w-full h-7',
        caption_label: 'text-sm font-medium z-0',
        nav: 'absolute inset-x-0 flex items-center justify-between px-2 pointer-events-none',
        button_previous:
          'h-7 w-7 inline-flex items-center justify-center rounded-md border border-input bg-background p-0 opacity-50 hover:opacity-100 hover:bg-accent z-10 pointer-events-auto',
        button_next:
          'h-7 w-7 inline-flex items-center justify-center rounded-md border border-input bg-background p-0 opacity-50 hover:opacity-100 hover:bg-accent z-10 pointer-events-auto',
        month_grid: 'w-full border-collapse space-x-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day_button:
          'h-8 w-8 p-0 font-normal inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100',
        range_start: 'day-range-start rounded-l-md',
        range_end: 'day-range-end rounded-r-md',
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        },
        MonthCaption: (captionProps) => (
          <CustomMonthCaption {...captionProps} setViewMode={setViewMode} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
