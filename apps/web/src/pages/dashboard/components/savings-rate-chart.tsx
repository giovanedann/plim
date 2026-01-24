import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { SavingsRateResponse } from '@plim/shared'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

interface SavingsRateChartProps {
  data: SavingsRateResponse | undefined
}

const chartConfig = {
  rate: {
    label: 'Taxa',
    color: 'hsl(var(--chart-2))',
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

export function SavingsRateChart({ data }: SavingsRateChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item) => ({
      month: formatMonth(item.month),
      rate: Math.round(item.rate * 10) / 10,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Economia</CardTitle>
        <CardDescription>Percentual economizado por mês</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              width={40}
              tickFormatter={(value) => `${value}%`}
              domain={['auto', 'auto']}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => `${value}%`} hideIndicator />}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-rate)', strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
