import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardQuery, TimelineGroupBy } from '@plim/shared'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { filterEmptyPeriods } from './filter-empty-periods'

type TimeRange = 'month' | 'quarter' | 'year'

function getDateRange(range: TimeRange): { start_date: string; end_date: string } {
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  let startDate: Date

  switch (range) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
  }

  return {
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
  }
}

function getDefaultGroupBy(range: TimeRange): TimelineGroupBy {
  switch (range) {
    case 'month':
      return 'day'
    case 'quarter':
      return 'week'
    case 'year':
      return 'month'
  }
}

export function useDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange])
  const groupBy = useMemo(() => getDefaultGroupBy(timeRange), [timeRange])

  const query: DashboardQuery = useMemo(
    () => ({ ...dateRange, group_by: groupBy }),
    [dateRange, groupBy]
  )

  const dashboardQuery = useQuery({
    queryKey: [...queryKeys.dashboard.all, query] as const,
    queryFn: async () => {
      const result = await dashboardService.getDashboard(query)
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const filteredData = useMemo(
    () => (dashboardQuery.data ? filterEmptyPeriods(dashboardQuery.data) : undefined),
    [dashboardQuery.data]
  )

  return {
    timeRange,
    setTimeRange,
    dateRange,
    summary: filteredData?.summary,
    expensesTimeline: filteredData?.expensesTimeline,
    incomeVsExpenses: filteredData?.incomeVsExpenses,
    categoryBreakdown: filteredData?.categoryBreakdown,
    paymentBreakdown: filteredData?.paymentBreakdown,
    creditCardBreakdown: filteredData?.creditCardBreakdown,
    savingsRate: filteredData?.savingsRate,
    salaryTimeline: filteredData?.salaryTimeline,
    installmentForecast: filteredData?.installmentForecast,
    creditCardUtilization: filteredData?.creditCardUtilization,
    recurringVsOnetime: filteredData?.recurringVsOnetime,
    dayOfWeek: filteredData?.dayOfWeek,
    invoiceCalendar: filteredData?.invoiceCalendar,
    spendingLimitProgress: filteredData?.spendingLimitProgress,
    expenseForecast: filteredData?.expenseForecast,
    isLoading: dashboardQuery.isLoading,
  }
}

export type { TimeRange }
