import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { CardColor, CreditCardUtilizationResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'

interface CreditCardUtilizationChartProps {
  data: CreditCardUtilizationResponse | undefined
}

const COLOR_HEX: Record<CardColor | 'default', string> = {
  black: '#18181b',
  dark_blue: '#1e3a8a',
  yellow: '#eab308',
  red: '#dc2626',
  orange: '#ea580c',
  light_purple: '#a855f7',
  neon_green: '#22c55e',
  neon_blue: '#06b6d4',
  white: '#f4f4f5',
  silver: '#71717a',
  gold: '#d97706',
  rose_gold: '#f472b6',
  default: '#94a3b8',
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}...` : str
}

export function CreditCardUtilizationChart({ data }: CreditCardUtilizationChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item) => ({
      name: item.name,
      used: item.used_cents / 100,
      remaining: Math.max(0, (item.limit_cents - item.used_cents) / 100),
      limit: item.limit_cents / 100,
      percentage: item.utilization_percent,
      fill: COLOR_HEX[item.color as CardColor] ?? COLOR_HEX.default,
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      used: { label: 'Utilizado' },
      remaining: { label: 'Disponível', color: 'hsl(var(--muted))' },
    }
    for (const item of chartData) {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      }
    }
    return config
  }, [chartData])

  if (!chartData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Uso do Limite</CardTitle>
          <CardDescription>Utilização dos cartões de crédito</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado</p>
        </CardContent>
      </Card>
    )
  }

  const chartHeight = Math.max(200, chartData.length * 50)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Uso do Limite</CardTitle>
        <CardDescription>Utilização dos cartões de crédito</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
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
                value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`
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
              tickFormatter={(value) => truncate(value, 10)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(_value, _name, item) => {
                    const entry = item.payload
                    return (
                      <span>
                        {entry.name}: {formatBRL(entry.used * 100)} / {formatBRL(entry.limit * 100)}{' '}
                        ({entry.percentage.toFixed(1)}%)
                      </span>
                    )
                  }}
                />
              }
            />
            <Bar dataKey="used" stackId="stack" radius={[4, 0, 0, 4]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
            <Bar
              dataKey="remaining"
              stackId="stack"
              fill="hsl(var(--muted))"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
