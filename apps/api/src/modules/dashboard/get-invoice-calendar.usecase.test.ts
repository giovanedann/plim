import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetInvoiceCalendarUseCase } from './get-invoice-calendar.usecase'

type MockRepository = {
  getUpcomingInvoices: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getUpcomingInvoices: vi.fn(),
  }
}

describe('GetInvoiceCalendarUseCase', () => {
  let sut: GetInvoiceCalendarUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetInvoiceCalendarUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns { data: [] } when no invoices exist', async () => {
    mockRepository.getUpcomingInvoices.mockResolvedValue([])

    const result = await sut.execute('user-123')

    expect(result).toEqual({ data: [] })
  })

  it('returns invoices wrapped in { data } when invoices exist', async () => {
    const invoices = [
      { credit_card_id: 'cc-1', name: 'Nubank', due_date: '2024-02-10', amount_cents: 15000 },
      { credit_card_id: 'cc-2', name: 'Itaú', due_date: '2024-02-15', amount_cents: 30000 },
    ]
    mockRepository.getUpcomingInvoices.mockResolvedValue(invoices)

    const result = await sut.execute('user-123')

    expect(result).toEqual({ data: invoices })
  })

  it('passes userId to the repository', async () => {
    mockRepository.getUpcomingInvoices.mockResolvedValue([])

    await sut.execute('user-789')

    expect(mockRepository.getUpcomingInvoices).toHaveBeenCalledWith('user-789')
    expect(mockRepository.getUpcomingInvoices).toHaveBeenCalledTimes(1)
  })
})
