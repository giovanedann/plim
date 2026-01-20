import { Button } from '@/components/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatBRL } from '@myfinances/shared'
import type { Expense } from '@myfinances/shared'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface ExpenseChartProps {
  expenses: Expense[]
  selectedMonth: string // "YYYY-MM"
  isLoading: boolean
}

type ViewMode = 'daily' | 'weekly'

interface DailyData {
  label: string
  total: number
}

interface WeeklyData {
  label: string
  total: number
}

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year!, month!, 0).getDate()
}

function getWeekOfMonth(day: number): number {
  return Math.ceil(day / 7)
}

function aggregateByDay(expenses: Expense[], selectedMonth: string): DailyData[] {
  const daysInMonth = getDaysInMonth(selectedMonth)
  const dailyTotals: Record<number, number> = {}

  // Initialize all days with 0
  for (let day = 1; day <= daysInMonth; day++) {
    dailyTotals[day] = 0
  }

  // Sum expenses by day
  for (const expense of expenses) {
    const day = new Date(`${expense.date}T00:00:00`).getDate()
    dailyTotals[day] = (dailyTotals[day] ?? 0) + expense.amount_cents
  }

  // Convert to array
  return Object.entries(dailyTotals).map(([day, total]) => ({
    label: day.padStart(2, '0'),
    total: total / 100, // Convert cents to reais
  }))
}

function aggregateByWeek(expenses: Expense[], selectedMonth: string): WeeklyData[] {
  const daysInMonth = getDaysInMonth(selectedMonth)
  const totalWeeks = Math.ceil(daysInMonth / 7)
  const weeklyTotals: Record<number, number> = {}

  // Initialize all weeks with 0
  for (let week = 1; week <= totalWeeks; week++) {
    weeklyTotals[week] = 0
  }

  // Sum expenses by week
  for (const expense of expenses) {
    const day = new Date(`${expense.date}T00:00:00`).getDate()
    const week = getWeekOfMonth(day)
    weeklyTotals[week] = (weeklyTotals[week] ?? 0) + expense.amount_cents
  }

  // Convert to array
  return Object.entries(weeklyTotals).map(([week, total]) => ({
    label: `Sem ${week}`,
    total: total / 100, // Convert cents to reais
  }))
}

export function ExpenseChart({ expenses, selectedMonth, isLoading }: ExpenseChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [isOpen, setIsOpen] = useState(true)

  const chartData = useMemo(() => {
    if (viewMode === 'daily') {
      return aggregateByDay(expenses, selectedMonth)
    }
    return aggregateByWeek(expenses, selectedMonth)
  }, [expenses, selectedMonth, viewMode])

  if (isLoading) {
    return <div className="h-[250px] animate-pulse rounded-lg bg-muted" />
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Despesas por período</h3>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="px-3 text-xs">
                Diário
              </TabsTrigger>
              <TabsTrigger value="weekly" className="px-3 text-xs">
                Semanal
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={isOpen ? 'Recolher gráfico' : 'Expandir gráfico'}
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `R$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(Number(value) * 100)}
                  hideIndicator
                />
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              fill="url(#fillTotal)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CollapsibleContent>
    </Collapsible>
  )
}
