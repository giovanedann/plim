import { lazy } from 'react'

export const CategoryBreakdownChart = lazy(() =>
  import('./category-breakdown-chart').then((m) => ({ default: m.CategoryBreakdownChart }))
)

export const CreditCardBreakdownChart = lazy(() =>
  import('./credit-card-breakdown-chart').then((m) => ({ default: m.CreditCardBreakdownChart }))
)

export const CreditCardUtilizationChart = lazy(() =>
  import('./credit-card-utilization-chart').then((m) => ({ default: m.CreditCardUtilizationChart }))
)

export const DayOfWeekChart = lazy(() =>
  import('./day-of-week-chart').then((m) => ({ default: m.DayOfWeekChart }))
)

export const ExpensesTimelineChart = lazy(() =>
  import('./expenses-timeline-chart').then((m) => ({ default: m.ExpensesTimelineChart }))
)

export const IncomeExpensesChart = lazy(() =>
  import('./income-expenses-chart').then((m) => ({ default: m.IncomeExpensesChart }))
)

export const InstallmentForecast = lazy(() =>
  import('./installment-forecast').then((m) => ({ default: m.InstallmentForecast }))
)

export const InvoiceCalendarChart = lazy(() =>
  import('./invoice-calendar-chart').then((m) => ({ default: m.InvoiceCalendarChart }))
)

export const PaymentBreakdownChart = lazy(() =>
  import('./payment-breakdown-chart').then((m) => ({ default: m.PaymentBreakdownChart }))
)

export const RecurringVsOnetimeChart = lazy(() =>
  import('./recurring-vs-onetime-chart').then((m) => ({ default: m.RecurringVsOnetimeChart }))
)

export const SalaryTimelineChart = lazy(() =>
  import('./salary-timeline-chart').then((m) => ({ default: m.SalaryTimelineChart }))
)

export const SavingsRateChart = lazy(() =>
  import('./savings-rate-chart').then((m) => ({ default: m.SavingsRateChart }))
)

export const SpendingLimitGaugeChart = lazy(() =>
  import('./spending-limit-gauge-chart').then((m) => ({ default: m.SpendingLimitGaugeChart }))
)

export const TopCategoriesChart = lazy(() =>
  import('./top-categories-chart').then((m) => ({ default: m.TopCategoriesChart }))
)
