import type { CreditCardUtilizationResponse } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreditCardUtilizationChart } from './credit-card-utilization-chart'

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}))

describe('CreditCardUtilizationChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and description', () => {
    render(<CreditCardUtilizationChart data={undefined} />)

    expect(screen.getByText('Uso do Limite')).toBeInTheDocument()
    expect(screen.getByText('Utilização dos cartões de crédito')).toBeInTheDocument()
  })

  it('shows empty state when data is undefined', () => {
    render(<CreditCardUtilizationChart data={undefined} />)

    expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument()
  })

  it('shows empty state when data.data is an empty array', () => {
    const data: CreditCardUtilizationResponse = { data: [] }

    render(<CreditCardUtilizationChart data={data} />)

    expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument()
  })

  it('shows the chart and not the empty state when data has credit cards', () => {
    const data: CreditCardUtilizationResponse = {
      data: [
        {
          credit_card_id: 'card-001',
          name: 'Nubank',
          color: 'black',
          bank: 'nubank',
          flag: 'mastercard',
          limit_cents: 500000,
          used_cents: 150000,
          utilization_percent: 30,
        },
      ],
    }

    render(<CreditCardUtilizationChart data={data} />)

    expect(screen.queryByText('Nenhum cartão cadastrado')).not.toBeInTheDocument()
  })
})
