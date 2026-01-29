import { type ApiResponse, api } from '@/lib/api-client'
import type { DashboardData, DashboardQuery } from '@plim/shared'

function buildQueryString(query: DashboardQuery): string {
  const params = new URLSearchParams()
  params.set('start_date', query.start_date)
  params.set('end_date', query.end_date)
  if (query.group_by) {
    params.set('group_by', query.group_by)
  }
  return `?${params.toString()}`
}

export const dashboardService = {
  async getDashboard(query: DashboardQuery): Promise<ApiResponse<DashboardData>> {
    return api.get<DashboardData>(`/dashboard${buildQueryString(query)}`)
  },
}
