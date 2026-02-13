/**
 * React Query caching configuration.
 *
 * Stale times are tuned based on how frequently data changes:
 * - Static data (categories, profile, credit cards): 5+ minutes
 * - Dynamic data (expenses): 1 minute
 * - Aggregated data (dashboard): 2 minutes
 */

const MINUTE = 1000 * 60

export const queryConfig = {
  staleTime: {
    categories: MINUTE * 10,
    profile: MINUTE * 10,
    creditCards: MINUTE * 10,
    salary: MINUTE * 5,
    spendingLimit: MINUTE * 5,
    expenses: MINUTE * 1,
    dashboard: MINUTE * 2,
  },
  gcTime: {
    default: MINUTE * 60 * 24,
  },
} as const

export const queryKeys = {
  categories: ['categories'] as const,
  profile: ['profile'] as const,
  creditCards: ['credit-cards'] as const,
  salary: (month: string) => ['salary', month] as const,
  spendingLimit: (month: string) => ['spending-limit', month] as const,
  expenses: (filters?: Record<string, unknown>) =>
    filters ? (['expenses', filters] as const) : (['expenses'] as const),
  dashboard: {
    all: ['dashboard'] as const,
    summary: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'summary', dateRange] as const,
    expensesTimeline: (query: Record<string, unknown>) =>
      ['dashboard', 'expenses-timeline', query] as const,
    incomeVsExpenses: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'income-vs-expenses', dateRange] as const,
    categoryBreakdown: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'category-breakdown', dateRange] as const,
    paymentBreakdown: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'payment-breakdown', dateRange] as const,
    creditCardBreakdown: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'credit-card-breakdown', dateRange] as const,
    savingsRate: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'savings-rate', dateRange] as const,
    salaryTimeline: (dateRange: { start_date: string; end_date: string }) =>
      ['dashboard', 'salary-timeline', dateRange] as const,
    installmentForecast: ['dashboard', 'installment-forecast'] as const,
  },
} as const
