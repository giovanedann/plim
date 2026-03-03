import type { InvoiceCalendarResponse } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvoiceCalendarChart } from './invoice-calendar-chart'

describe('InvoiceCalendarChart', () => {
  const mockInvoice: InvoiceCalendarResponse['data'][number] = {
    credit_card_id: 'card-001',
    credit_card_name: 'Nubank',
    color: 'black',
    bank: 'nubank',
    flag: 'mastercard',
    due_date: '2026-03-10',
    total_cents: 150000,
    paid_cents: 0,
    is_paid: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and description', () => {
    render(<InvoiceCalendarChart data={undefined} />)

    expect(screen.getByText('Calendário de Faturas')).toBeInTheDocument()
    expect(screen.getByText('Próximas faturas a vencer')).toBeInTheDocument()
  })

  it('shows empty state when data is undefined', () => {
    render(<InvoiceCalendarChart data={undefined} />)

    expect(screen.getByText('Nenhuma fatura próxima')).toBeInTheDocument()
  })

  it('shows empty state when data.data is empty', () => {
    const data: InvoiceCalendarResponse = { data: [] }

    render(<InvoiceCalendarChart data={data} />)

    expect(screen.getByText('Nenhuma fatura próxima')).toBeInTheDocument()
  })

  it('shows credit card name and formatted amount for a pending invoice', () => {
    const data: InvoiceCalendarResponse = { data: [mockInvoice] }

    render(<InvoiceCalendarChart data={data} />)

    expect(screen.getByText('Nubank')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
  })

  it('shows formatted due date (YYYY-MM-DD → DD/MM/YYYY)', () => {
    const data: InvoiceCalendarResponse = { data: [mockInvoice] }

    render(<InvoiceCalendarChart data={data} />)

    expect(screen.getByText('10/03/2026')).toBeInTheDocument()
  })

  it('groups invoices by month showing the month label', () => {
    const data: InvoiceCalendarResponse = { data: [mockInvoice] }

    render(<InvoiceCalendarChart data={data} />)

    expect(screen.getByText('Março 2026')).toBeInTheDocument()
  })

  it('applies line-through styling for paid invoices', () => {
    const paidInvoice: InvoiceCalendarResponse['data'][number] = {
      ...mockInvoice,
      paid_cents: 150000,
      is_paid: true,
    }
    const data: InvoiceCalendarResponse = { data: [paidInvoice] }

    render(<InvoiceCalendarChart data={data} />)

    const amountElement = screen.getByText('R$ 1.500,00')
    expect(amountElement).toHaveClass('line-through')
  })
})
