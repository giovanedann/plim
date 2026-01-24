import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { PAYMENT_METHODS, type PaymentBreakdownResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

interface PaymentBreakdownChartProps {
  data: PaymentBreakdownResponse | undefined
}

const PAYMENT_COLORS: Record<string, string> = {
  credit_card: 'hsl(var(--chart-1))',
  debit_card: 'hsl(var(--chart-2))',
  pix: 'hsl(var(--chart-3))',
  cash: 'hsl(var(--chart-4))',
}

function getPaymentLabel(method: string): string {
  const found = PAYMENT_METHODS.find((p) => p.value === method)
  return found?.label ?? method
}

export function PaymentBreakdownChart({ data }: PaymentBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item) => ({
      name: getPaymentLabel(item.method),
      value: item.amount / 100,
      percentage: item.percentage,
      fill: PAYMENT_COLORS[item.method] ?? 'hsl(var(--chart-5))',
    }))
  }, [data])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
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
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
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
        <CardTitle>Formas de Pagamento</CardTitle>
        <CardDescription>Como você está pagando</CardDescription>
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
