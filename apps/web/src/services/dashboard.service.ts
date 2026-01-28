import { type ApiResponse, api } from '@/lib/api-client'
import type { DashboardData, TimelineGroupBy } from '@plim/shared'

export interface DashboardQuery {
  start_date: string
  end_date: string
  group_by?: TimelineGroupBy
}

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
