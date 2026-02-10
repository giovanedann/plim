import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { Lock } from 'lucide-react'
import type { TimeRange } from '../use-dashboard'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const FREE_RANGE: TimeRange = 'month'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const { isPro } = usePlanLimits()

  const handleValueChange = (v: string) => {
    const range = v as TimeRange
    if (!isPro && range !== FREE_RANGE) return
    onChange(range)
  }

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabsList>
        {TIME_RANGE_OPTIONS.map((option) => {
          const locked = !isPro && option.value !== FREE_RANGE
          if (locked) {
            return (
              <TooltipProvider key={option.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <TabsTrigger value={option.value} disabled className="gap-1 opacity-50">
                        {option.label}
                        <Lock className="h-3 w-3" />
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Disponível no plano Pro</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }
          return (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
