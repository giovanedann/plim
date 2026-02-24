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
import { formatBRL } from '@plim/shared'
import type { Expense } from '@plim/shared'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts'

interface ExpenseChartProps {
  expenses: Expense[]
  selectedMonth: string // "YYYY-MM"
  isLoading: boolean
}

type ViewMode = 'daily' | 'weekly'

interface ChartDataPoint {
  label: string
  expenses: number
  incomes: number
}

const EXPENSE_COLOR = 'hsl(0 84% 60%)'
const INCOME_COLOR = 'hsl(142.1 76.2% 36.3%)'

const chartConfig = {
  expenses: {
    label: 'Despesas',
    color: EXPENSE_COLOR,
  },
  incomes: {
    label: 'Receitas',
    color: INCOME_COLOR,
  },
} satisfies ChartConfig

function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year!, month!, 0).getDate()
}

function getWeekOfMonth(day: number): number {
  return Math.ceil(day / 7)
}

function aggregateByDay(transactions: Expense[], selectedMonth: string): ChartDataPoint[] {
  const daysInMonth = getDaysInMonth(selectedMonth)
  const dailyExpenses: Record<number, number> = {}
  const dailyIncomes: Record<number, number> = {}

  for (let day = 1; day <= daysInMonth; day++) {
    dailyExpenses[day] = 0
    dailyIncomes[day] = 0
  }

  for (const transaction of transactions) {
    const day = new Date(`${transaction.date}T00:00:00`).getDate()
    if (transaction.type === 'income') {
      dailyIncomes[day] = (dailyIncomes[day] ?? 0) + transaction.amount_cents
    } else {
      dailyExpenses[day] = (dailyExpenses[day] ?? 0) + transaction.amount_cents
    }
  }

  return Object.keys(dailyExpenses).map((dayStr) => {
    const day = Number(dayStr)
    return {
      label: String(day).padStart(2, '0'),
      expenses: (dailyExpenses[day] ?? 0) / 100,
      incomes: (dailyIncomes[day] ?? 0) / 100,
    }
  })
}

function aggregateByWeek(transactions: Expense[], selectedMonth: string): ChartDataPoint[] {
  const daysInMonth = getDaysInMonth(selectedMonth)
  const totalWeeks = Math.ceil(daysInMonth / 7)
  const weeklyExpenses: Record<number, number> = {}
  const weeklyIncomes: Record<number, number> = {}

  for (let week = 1; week <= totalWeeks; week++) {
    weeklyExpenses[week] = 0
    weeklyIncomes[week] = 0
  }

  for (const transaction of transactions) {
    const day = new Date(`${transaction.date}T00:00:00`).getDate()
    const week = getWeekOfMonth(day)
    if (transaction.type === 'income') {
      weeklyIncomes[week] = (weeklyIncomes[week] ?? 0) + transaction.amount_cents
    } else {
      weeklyExpenses[week] = (weeklyExpenses[week] ?? 0) + transaction.amount_cents
    }
  }

  return Object.keys(weeklyExpenses).map((weekStr) => {
    const week = Number(weekStr)
    return {
      label: `Sem ${week}`,
      expenses: (weeklyExpenses[week] ?? 0) / 100,
      incomes: (weeklyIncomes[week] ?? 0) / 100,
    }
  })
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

  const hasIncomes = useMemo(() => expenses.some((t) => t.type === 'income'), [expenses])

  if (isLoading) {
    return <div className="h-[250px] animate-pulse rounded-lg bg-muted" />
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {hasIncomes ? 'Despesas e Receitas por período' : 'Despesas por período'}
        </h3>
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
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <ChartTooltipContent formatter={(value) => formatBRL(Number(value) * 100)} />
              }
            />
            {hasIncomes && (
              <Legend formatter={(value) => (value === 'expenses' ? 'Despesas' : 'Receitas')} />
            )}
            <Bar dataKey="expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
            {hasIncomes && <Bar dataKey="incomes" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ChartContainer>
      </CollapsibleContent>
    </Collapsible>
  )
}
