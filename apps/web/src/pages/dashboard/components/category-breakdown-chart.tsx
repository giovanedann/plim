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
import { Cell, Pie, PieChart } from 'recharts'

interface CategoryBreakdownChartProps {
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

export function CategoryBreakdownChart({ data, isLoading }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.slice(0, 5).map((item, index) => ({
      name: item.name,
      value: item.amount / 100,
      percentage: item.percentage,
      fill: item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    for (let i = 0; i < chartData.length; i++) {
      const item = chartData[i]!
      config[item.name] = {
        label: item.name,
        color: item.fill || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }
    }
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
          <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>Distribuição do período</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Top 5 categorias do período</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-[200px] w-full max-w-[200px] sm:max-w-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span>
                      {name}: {formatBRL(Number(value) * 100)}
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
