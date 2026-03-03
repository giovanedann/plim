import type { RecurringVsOnetimeResponse } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecurringVsOnetimeChart } from './recurring-vs-onetime-chart'

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
}))

describe('RecurringVsOnetimeChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and description', () => {
    render(<RecurringVsOnetimeChart data={undefined} />)

    expect(screen.getByText('Recorrentes vs Avulsas')).toBeInTheDocument()
    expect(screen.getByText('Distribuição de gastos fixos e variáveis')).toBeInTheDocument()
  })

  it('shows empty state when data is undefined', () => {
    render(<RecurringVsOnetimeChart data={undefined} />)

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument()
  })

  it('shows empty state when both recurring_amount and onetime_amount are 0', () => {
    const data: RecurringVsOnetimeResponse = {
      recurring_amount: 0,
      onetime_amount: 0,
      recurring_percentage: 0,
      onetime_percentage: 0,
    }

    render(<RecurringVsOnetimeChart data={data} />)

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument()
  })

  it('displays formatted amounts in the legend when data has values', () => {
    const data: RecurringVsOnetimeResponse = {
      recurring_amount: 100000,
      onetime_amount: 50000,
      recurring_percentage: 66.7,
      onetime_percentage: 33.3,
    }

    render(<RecurringVsOnetimeChart data={data} />)

    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument()
  })

  it('shows "Recorrentes" and "Avulsas" labels in the legend when data has values', () => {
    const data: RecurringVsOnetimeResponse = {
      recurring_amount: 100000,
      onetime_amount: 50000,
      recurring_percentage: 66.7,
      onetime_percentage: 33.3,
    }

    render(<RecurringVsOnetimeChart data={data} />)

    expect(screen.getByText('Recorrentes')).toBeInTheDocument()
    expect(screen.getByText('Avulsas')).toBeInTheDocument()
  })
})
