import { queryConfig, queryKeys } from '@/lib/query-config'
import { dashboardService } from '@/services/dashboard.service'
import type { DashboardQuery, ExpensesTimelineQuery, TimelineGroupBy } from '@plim/shared'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

type TimeRange = 'month' | 'quarter' | 'year'

function getDateRange(range: TimeRange): DashboardQuery {
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
  const defaultGroupBy = useMemo(() => getDefaultGroupBy(timeRange), [timeRange])

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getSummary(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const timelineQuery: ExpensesTimelineQuery = useMemo(
    () => ({ ...dateRange, group_by: defaultGroupBy }),
    [dateRange, defaultGroupBy]
  )

  const expensesTimelineQuery = useQuery({
    queryKey: queryKeys.dashboard.expensesTimeline(timelineQuery),
    queryFn: async () => {
      const result = await dashboardService.getExpensesTimeline(timelineQuery)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const incomeVsExpensesQuery = useQuery({
    queryKey: queryKeys.dashboard.incomeVsExpenses(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getIncomeVsExpenses(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const categoryBreakdownQuery = useQuery({
    queryKey: queryKeys.dashboard.categoryBreakdown(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getCategoryBreakdown(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const paymentBreakdownQuery = useQuery({
    queryKey: queryKeys.dashboard.paymentBreakdown(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getPaymentBreakdown(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const creditCardBreakdownQuery = useQuery({
    queryKey: queryKeys.dashboard.creditCardBreakdown(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getCreditCardBreakdown(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const savingsRateQuery = useQuery({
    queryKey: queryKeys.dashboard.savingsRate(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getSavingsRate(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const salaryTimelineQuery = useQuery({
    queryKey: queryKeys.dashboard.salaryTimeline(dateRange),
    queryFn: async () => {
      const result = await dashboardService.getSalaryTimeline(dateRange)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const installmentForecastQuery = useQuery({
    queryKey: queryKeys.dashboard.installmentForecast,
    queryFn: async () => {
      const result = await dashboardService.getInstallmentForecast()
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.dashboard,
  })

  const isLoading =
    summaryQuery.isLoading ||
    expensesTimelineQuery.isLoading ||
    incomeVsExpensesQuery.isLoading ||
    categoryBreakdownQuery.isLoading

  return {
    timeRange,
    setTimeRange,
    dateRange,
    summary: summaryQuery.data,
    expensesTimeline: expensesTimelineQuery.data,
    incomeVsExpenses: incomeVsExpensesQuery.data,
    categoryBreakdown: categoryBreakdownQuery.data,
    paymentBreakdown: paymentBreakdownQuery.data,
    creditCardBreakdown: creditCardBreakdownQuery.data,
    savingsRate: savingsRateQuery.data,
    salaryTimeline: salaryTimelineQuery.data,
    installmentForecast: installmentForecastQuery.data,
    isLoading,
    isSummaryLoading: summaryQuery.isLoading,
    isExpensesTimelineLoading: expensesTimelineQuery.isLoading,
    isIncomeVsExpensesLoading: incomeVsExpensesQuery.isLoading,
    isCategoryBreakdownLoading: categoryBreakdownQuery.isLoading,
    isPaymentBreakdownLoading: paymentBreakdownQuery.isLoading,
    isCreditCardBreakdownLoading: creditCardBreakdownQuery.isLoading,
    isSavingsRateLoading: savingsRateQuery.isLoading,
    isSalaryTimelineLoading: salaryTimelineQuery.isLoading,
    isInstallmentForecastLoading: installmentForecastQuery.isLoading,
  }
}

export type { TimeRange }
