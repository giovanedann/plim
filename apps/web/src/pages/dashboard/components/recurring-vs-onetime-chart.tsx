import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { RecurringVsOnetimeResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

interface RecurringVsOnetimeChartProps {
  data: RecurringVsOnetimeResponse | undefined
}

const chartConfig = {
  recurring: {
    label: 'Recorrentes',
    color: 'hsl(var(--chart-2))',
  },
  onetime: {
    label: 'Avulsas',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function RecurringVsOnetimeChart({ data }: RecurringVsOnetimeChartProps) {
  const chartData = useMemo(() => {
    if (!data) return []
    if (data.recurring_amount === 0 && data.onetime_amount === 0) return []
    return [
      {
        name: 'Recorrentes',
        value: data.recurring_amount / 100,
        percentage: data.recurring_percentage,
        fill: 'hsl(var(--chart-2))',
      },
      {
        name: 'Avulsas',
        value: data.onetime_amount / 100,
        percentage: data.onetime_percentage,
        fill: 'hsl(var(--chart-1))',
      },
    ]
  }, [data])

  if (!chartData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recorrentes vs Avulsas</CardTitle>
          <CardDescription>Distribuição de gastos fixos e variáveis</CardDescription>
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
        <CardTitle>Recorrentes vs Avulsas</CardTitle>
        <CardDescription>Distribuição de gastos fixos e variáveis</CardDescription>
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
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{formatBRL(item.value * 100)}</span>
                <span className="font-medium">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
