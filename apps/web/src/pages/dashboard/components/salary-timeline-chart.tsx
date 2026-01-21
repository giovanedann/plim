import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { SalaryTimelineResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

interface SalaryTimelineChartProps {
  data: SalaryTimelineResponse | undefined
  isLoading: boolean
}

const chartConfig = {
  amount: {
    label: 'Salário',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

function formatDate(date: string): string {
  const d = new Date(date)
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
  return `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`
}

export function SalaryTimelineChart({ data, isLoading }: SalaryTimelineChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    return data.data.map((item) => ({
      date: formatDate(item.date),
      amount: item.amount / 100,
      rawAmount: item.amount,
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
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Salário</CardTitle>
          <CardDescription>Evolução da receita mensal</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cadastre seu salário para ver o histórico</p>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 1) {
    const currentSalary = chartData[0]!
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salário Atual</CardTitle>
          <CardDescription>Desde {currentSalary.date}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] flex-col items-center justify-center">
          <p className="text-3xl font-bold text-emerald-500">
            {formatBRL(currentSalary.rawAmount)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adicione mais registros para ver o histórico
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Salário</CardTitle>
        <CardDescription>Evolução da receita mensal</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
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
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(Number(value) * 100)}
                  hideIndicator
                />
              }
            />
            <Line
              type="stepAfter"
              dataKey="amount"
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-amount)', strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
