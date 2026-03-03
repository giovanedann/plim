import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ExpenseForecastResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface ExpenseForecastChartProps {
  data: ExpenseForecastResponse | undefined
}

const chartConfig = {
  actual_amount: {
    label: 'Realizado',
    color: 'hsl(var(--chart-2))',
  },
  projected_amount: {
    label: 'Projetado',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig

export function ExpenseForecastChart({ data }: ExpenseForecastChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    return data.data.map((item) => {
      const day = Number(item.date.slice(8))
      return {
        day,
        actual_amount: item.actual_amount !== null ? item.actual_amount / 100 : null,
        projected_amount: item.projected_amount !== null ? item.projected_amount / 100 : null,
      }
    })
  }, [data])

  if (!chartData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Projeção de Gastos</CardTitle>
          <CardDescription>Previsão para o final do mês</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para projeção</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Projeção de Gastos</CardTitle>
        <CardDescription>Previsão para o final do mês</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              ticks={[1, 5, 10, 15, 20, 25, 30]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              width={50}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    value !== null ? formatBRL(Number(value) * 100) : '-'
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="actual_amount"
              stroke="hsl(var(--chart-2))"
              fill="url(#fillActual)"
              strokeWidth={2}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projected_amount"
              stroke="hsl(var(--chart-4))"
              fill="none"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
        {data && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Projeção para o final do mês:{' '}
            <span className="font-medium text-foreground">
              {formatBRL(data.projected_end_of_month)}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
