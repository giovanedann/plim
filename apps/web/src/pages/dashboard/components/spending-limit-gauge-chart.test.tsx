import type { SpendingLimitProgressResponse } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpendingLimitGaugeChart } from './spending-limit-gauge-chart'

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

vi.mock('recharts', () => ({
  RadialBarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadialBar: () => null,
}))

describe('SpendingLimitGaugeChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and description when data is undefined', () => {
    render(<SpendingLimitGaugeChart data={undefined} />)

    expect(screen.getByText('Limite de Gastos')).toBeInTheDocument()
    expect(screen.getByText('Progresso do mês atual')).toBeInTheDocument()
  })

  it('renders the title and description when data is null', () => {
    render(<SpendingLimitGaugeChart data={null} />)

    expect(screen.getByText('Limite de Gastos')).toBeInTheDocument()
    expect(screen.getByText('Progresso do mês atual')).toBeInTheDocument()
  })

  it('renders the title and description when data is provided', () => {
    const data: SpendingLimitProgressResponse = {
      percentage: 75,
      days_remaining: 10,
      spent_cents: 75000,
      limit_cents: 100000,
    }

    render(<SpendingLimitGaugeChart data={data} />)

    expect(screen.getByText('Limite de Gastos')).toBeInTheDocument()
    expect(screen.getByText('Progresso do mês atual')).toBeInTheDocument()
  })

  it('shows "Sem dados para exibir" when data is undefined', () => {
    render(<SpendingLimitGaugeChart data={undefined} />)

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument()
  })

  it('shows "Defina um limite de gastos" when data is null', () => {
    render(<SpendingLimitGaugeChart data={null} />)

    expect(screen.getByText('Defina um limite de gastos')).toBeInTheDocument()
  })

  it('shows the preferences guidance message when data is null', () => {
    render(<SpendingLimitGaugeChart data={null} />)

    expect(
      screen.getByText('Configure nas suas preferências para acompanhar seus gastos')
    ).toBeInTheDocument()
  })

  it('shows the percentage when data is provided', () => {
    const data: SpendingLimitProgressResponse = {
      percentage: 75,
      days_remaining: 10,
      spent_cents: 75000,
      limit_cents: 100000,
    }

    render(<SpendingLimitGaugeChart data={data} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows "dias restantes" when days_remaining is greater than 1', () => {
    const data: SpendingLimitProgressResponse = {
      percentage: 50,
      days_remaining: 10,
      spent_cents: 50000,
      limit_cents: 100000,
    }

    render(<SpendingLimitGaugeChart data={data} />)

    expect(screen.getByText('10 dias restantes')).toBeInTheDocument()
  })

  it('shows "dia restante" when days_remaining is 1', () => {
    const data: SpendingLimitProgressResponse = {
      percentage: 95,
      days_remaining: 1,
      spent_cents: 95000,
      limit_cents: 100000,
    }

    render(<SpendingLimitGaugeChart data={data} />)

    expect(screen.getByText('1 dia restante')).toBeInTheDocument()
  })

  it('shows formatted spent and limit amounts', () => {
    const data: SpendingLimitProgressResponse = {
      percentage: 75,
      days_remaining: 10,
      spent_cents: 75000,
      limit_cents: 100000,
    }

    render(<SpendingLimitGaugeChart data={data} />)

    expect(screen.getByText('R$ 750,00 / R$ 1.000,00')).toBeInTheDocument()
  })
})
