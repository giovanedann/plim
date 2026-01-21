import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { CategoryBreakdownResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

interface TopCategoriesChartProps {
  data: CategoryBreakdownResponse | undefined
  isLoading: boolean
}

const FALLBACK_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function TopCategoriesChart({ data, isLoading }: TopCategoriesChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.slice(0, 5).map((item, index) => ({
      name: item.name,
      amount: item.amount / 100,
      fill: item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      amount: { label: 'Valor' },
    }
    chartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: item.fill || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }
    })
    return config
  }, [chartData])

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
          <CardTitle>Top Categorias</CardTitle>
          <CardDescription>Maiores gastos do período</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categorias</CardTitle>
        <CardDescription>Maiores gastos do período</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) =>
                `R$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={80}
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
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
