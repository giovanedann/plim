import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { CardBank, CardColor, CardFlag, CreditCardBreakdownResponse } from '@plim/shared'
import { formatBRL } from '@plim/shared'
import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

interface CreditCardBreakdownChartProps {
  data: CreditCardBreakdownResponse | undefined
  isLoading: boolean
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

const FLAG_DISPLAY: Record<CardFlag, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  elo: 'Elo',
  american_express: 'Amex',
  hipercard: 'Hipercard',
  diners: 'Diners',
  other: '',
}

const BANK_DISPLAY: Record<CardBank, string> = {
  nubank: 'Nubank',
  inter: 'Inter',
  c6_bank: 'C6 Bank',
  itau: 'Itaú',
  bradesco: 'Bradesco',
  santander: 'Santander',
  banco_do_brasil: 'BB',
  caixa: 'Caixa',
  original: 'Original',
  neon: 'Neon',
  next: 'Next',
  picpay: 'PicPay',
  mercado_pago: 'Mercado Pago',
  other: '',
}

function getCardLabel(name: string, bank: string, flag: string): string {
  if (!bank && !flag) return name
  const bankLabel = BANK_DISPLAY[bank as CardBank] || bank
  const flagLabel = FLAG_DISPLAY[flag as CardFlag] || flag
  if (bankLabel && flagLabel) return `${name} (${bankLabel} - ${flagLabel})`
  if (bankLabel) return `${name} (${bankLabel})`
  if (flagLabel) return `${name} (${flagLabel})`
  return name
}

export function CreditCardBreakdownChart({ data, isLoading }: CreditCardBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item) => ({
      name: item.credit_card_id ? getCardLabel(item.name, item.bank, item.flag) : item.name,
      shortName: item.name,
      value: item.amount / 100,
      percentage: item.percentage,
      fill: COLOR_HEX[item.color as CardColor] ?? COLOR_HEX.default,
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
          <CardTitle>Cartões de Crédito</CardTitle>
          <CardDescription>Gastos por cartão</CardDescription>
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
        <CardTitle>Cartões de Crédito</CardTitle>
        <CardDescription>Gastos por cartão</CardDescription>
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
                <span className="text-muted-foreground truncate max-w-[150px]" title={item.name}>
                  {item.shortName}
                </span>
              </div>
              <span className="font-medium">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
