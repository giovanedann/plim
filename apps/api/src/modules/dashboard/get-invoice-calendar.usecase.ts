import type { InvoiceCalendarResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetInvoiceCalendarUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string): Promise<InvoiceCalendarResponse> {
    const data = await this.dashboardRepository.getUpcomingInvoices(userId)
    return { data }
  }
}
