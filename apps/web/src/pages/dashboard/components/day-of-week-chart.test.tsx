import type { DayOfWeekResponse } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DayOfWeekChart } from './day-of-week-chart'

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
}))

describe('DayOfWeekChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and description', () => {
    render(<DayOfWeekChart data={undefined} />)

    expect(screen.getByText('Gastos por Dia da Semana')).toBeInTheDocument()
    expect(screen.getByText('Média de gastos por dia')).toBeInTheDocument()
  })

  it('shows empty state when data is undefined', () => {
    render(<DayOfWeekChart data={undefined} />)

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument()
  })

  it('shows empty state when data.data is an empty array', () => {
    const data: DayOfWeekResponse = { data: [] }

    render(<DayOfWeekChart data={data} />)

    expect(screen.getByText('Sem dados para exibir')).toBeInTheDocument()
  })

  it('does not show empty state when data has entries', () => {
    const data: DayOfWeekResponse = {
      data: [
        { day_of_week: 1, label: 'Segunda', average_amount: 5000 },
        { day_of_week: 2, label: 'Terça', average_amount: 3000 },
      ],
    }

    render(<DayOfWeekChart data={data} />)

    expect(screen.queryByText('Sem dados para exibir')).not.toBeInTheDocument()
  })
})
