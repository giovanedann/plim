import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import type { SpendingLimitProgressResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { RadialBar, RadialBarChart } from 'recharts'

interface SpendingLimitGaugeChartProps {
  data: SpendingLimitProgressResponse | null | undefined
}

function getGaugeColor(percentage: number): string {
  if (percentage > 90) return 'hsl(var(--chart-1))'
  if (percentage > 70) return 'hsl(var(--chart-4))'
  return 'hsl(var(--chart-2))'
}

const chartConfig = {
  progress: {
    label: 'Progresso',
  },
} satisfies ChartConfig

export function SpendingLimitGaugeChart({ data }: SpendingLimitGaugeChartProps) {
  const gaugeData = useMemo(() => {
    if (!data) return null
    return [
      {
        name: 'progress',
        value: Math.min(data.percentage, 100),
        fill: getGaugeColor(data.percentage),
      },
    ]
  }, [data])

  if (data === undefined) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Limite de Gastos</CardTitle>
          <CardDescription>Progresso do mês atual</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    )
  }

  if (data === null) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Limite de Gastos</CardTitle>
          <CardDescription>Progresso do mês atual</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">Defina um limite de gastos</p>
          <p className="text-xs text-muted-foreground">
            Configure nas suas preferências para acompanhar seus gastos
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Limite de Gastos</CardTitle>
        <CardDescription>Progresso do mês atual</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[180px] w-full">
          <RadialBarChart
            data={gaugeData!}
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="90%"
            cx="50%"
            cy="80%"
          >
            <RadialBar
              dataKey="value"
              background
              cornerRadius={8}
            />
            <text
              x="50%"
              y="70%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-2xl font-bold"
            >
              {data.percentage.toFixed(0)}%
            </text>
          </RadialBarChart>
        </ChartContainer>
        <div className="mt-2 flex flex-col items-center gap-1 text-sm">
          <span className="text-muted-foreground">
            {data.days_remaining} {data.days_remaining === 1 ? 'dia restante' : 'dias restantes'}
          </span>
          <span className="font-medium">
            {formatBRL(data.spent_cents)} / {formatBRL(data.limit_cents)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
