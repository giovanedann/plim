import { api } from '@/lib/api-client'
import type {
  CategoryBreakdownResponse,
  CreditCardBreakdownResponse,
  DashboardQuery,
  DashboardSummary,
  ExpensesTimelineQuery,
  ExpensesTimelineResponse,
  IncomeVsExpensesResponse,
  InstallmentForecastResponse,
  PaymentBreakdownResponse,
  SalaryTimelineResponse,
  SavingsRateResponse,
} from '@plim/shared'

function buildQueryString(query: DashboardQuery | ExpensesTimelineQuery): string {
  const params = new URLSearchParams()
  params.set('start_date', query.start_date)
  params.set('end_date', query.end_date)
  if ('group_by' in query && query.group_by) {
    params.set('group_by', query.group_by)
  }
  return `?${params.toString()}`
}

export const dashboardService = {
  async getSummary(query: DashboardQuery) {
    return api.get<DashboardSummary>(`/dashboard/summary${buildQueryString(query)}`)
  },

  async getExpensesTimeline(query: ExpensesTimelineQuery) {
    return api.get<ExpensesTimelineResponse>(
      `/dashboard/expenses-timeline${buildQueryString(query)}`
    )
  },

  async getIncomeVsExpenses(query: DashboardQuery) {
    return api.get<IncomeVsExpensesResponse>(
      `/dashboard/income-vs-expenses${buildQueryString(query)}`
    )
  },

  async getCategoryBreakdown(query: DashboardQuery) {
    return api.get<CategoryBreakdownResponse>(
      `/dashboard/category-breakdown${buildQueryString(query)}`
    )
  },

  async getPaymentBreakdown(query: DashboardQuery) {
    return api.get<PaymentBreakdownResponse>(
      `/dashboard/payment-breakdown${buildQueryString(query)}`
    )
  },

  async getCreditCardBreakdown(query: DashboardQuery) {
    return api.get<CreditCardBreakdownResponse>(
      `/dashboard/credit-card-breakdown${buildQueryString(query)}`
    )
  },

  async getSavingsRate(query: DashboardQuery) {
    return api.get<SavingsRateResponse>(`/dashboard/savings-rate${buildQueryString(query)}`)
  },

  async getSalaryTimeline(query: DashboardQuery) {
    return api.get<SalaryTimelineResponse>(`/dashboard/salary-timeline${buildQueryString(query)}`)
  },

  async getInstallmentForecast() {
    return api.get<InstallmentForecastResponse>('/dashboard/installment-forecast')
  },
}
