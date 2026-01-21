import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { IncomeVsExpensesResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface IncomeExpensesChartProps {
  data: IncomeVsExpensesResponse | undefined
  isLoading: boolean
}

const chartConfig = {
  income: {
    label: 'Receita',
    color: 'hsl(var(--chart-2))',
  },
  expenses: {
    label: 'Despesas',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  return `${monthNames[Number(m) - 1]} ${year?.slice(2)}`
}

export function IncomeExpensesChart({ data, isLoading }: IncomeExpensesChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item) => ({
      month: formatMonth(item.month),
      income: item.income / 100,
      expenses: item.expenses / 100,
    }))
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs Despesas</CardTitle>
        <CardDescription>Comparação mensal de entrada e saída</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) =>
                `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => formatBRL(Number(value) * 100)} />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
