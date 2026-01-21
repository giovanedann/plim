import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TimeRange } from '../use-dashboard'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        {TIME_RANGE_OPTIONS.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
