import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { DayOfWeekResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

interface DayOfWeekChartProps {
  data: DayOfWeekResponse | undefined
}

const chartConfig = {
  average: {
    label: 'Média',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []
    const byDay = new Map(data.data.map((d) => [d.day_of_week, d]))
    return DAY_ORDER.map((dayIndex) => {
      const item = byDay.get(dayIndex)
      return {
        day: DAY_LABELS[dayIndex],
        average: (item?.average_amount ?? 0) / 100,
      }
    })
  }, [data])

  if (!chartData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Gastos por Dia da Semana</CardTitle>
          <CardDescription>Média de gastos por dia</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Gastos por Dia da Semana</CardTitle>
        <CardDescription>Média de gastos por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[250px] w-full">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="day" fontSize={12} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(Number(value) * 100)}
                  hideIndicator
                />
              }
            />
            <Radar
              dataKey="average"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.5}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
