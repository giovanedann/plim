import { z } from 'zod'

export const timelineGroupBySchema = z.enum(['day', 'week', 'month'])

export const dashboardQuerySchema = z.object({
  start_date: z.iso.date(),
  end_date: z.iso.date(),
  group_by: timelineGroupBySchema.optional(),
})

export const expensesTimelineQuerySchema = dashboardQuerySchema.extend({
  group_by: timelineGroupBySchema.default('day'),
})

export const summaryComparisonSchema = z.object({
  previous_income: z.number().int().nonnegative(),
  previous_expenses: z.number().int().nonnegative(),
  previous_balance: z.number().int(),
})

export const dashboardSummarySchema = z.object({
  total_income: z.number().int().nonnegative(),
  total_expenses: z.number().int().nonnegative(),
  balance: z.number().int(),
  savings_rate: z.number(),
  comparison: summaryComparisonSchema,
})

export const timelineDataPointSchema = z.object({
  date: z.string(),
  amount: z.number().int().nonnegative(),
})

export const expensesTimelineResponseSchema = z.object({
  data: z.array(timelineDataPointSchema),
  group_by: timelineGroupBySchema,
})

export const incomeExpensesDataPointSchema = z.object({
  month: z.string(),
  income: z.number().int().nonnegative(),
  expenses: z.number().int().nonnegative(),
})

export const incomeVsExpensesResponseSchema = z.object({
  data: z.array(incomeExpensesDataPointSchema),
})

export const categoryBreakdownItemSchema = z.object({
  category_id: z.uuid().nullable(),
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  amount: z.number().int().nonnegative(),
  percentage: z.number(),
})

export const categoryBreakdownResponseSchema = z.object({
  data: z.array(categoryBreakdownItemSchema),
  total: z.number().int().nonnegative(),
})

export const paymentBreakdownItemSchema = z.object({
  method: z.string(),
  amount: z.number().int().nonnegative(),
  percentage: z.number(),
})

export const paymentBreakdownResponseSchema = z.object({
  data: z.array(paymentBreakdownItemSchema),
  total: z.number().int().nonnegative(),
})

export const savingsRateDataPointSchema = z.object({
  month: z.string(),
  rate: z.number(),
})

export const savingsRateResponseSchema = z.object({
  data: z.array(savingsRateDataPointSchema),
})

export const salaryTimelineDataPointSchema = z.object({
  date: z.string(),
  amount: z.number().int().nonnegative(),
})

export const salaryTimelineResponseSchema = z.object({
  data: z.array(salaryTimelineDataPointSchema),
})

export const installmentForecastMonthSchema = z.object({
  month: z.string(),
  total: z.number().int().nonnegative(),
})

export const installmentForecastResponseSchema = z.object({
  data: z.array(installmentForecastMonthSchema),
})

export const creditCardBreakdownItemSchema = z.object({
  credit_card_id: z.uuid().nullable(),
  name: z.string(),
  color: z.string(),
  bank: z.string(),
  flag: z.string(),
  amount: z.number().int().nonnegative(),
  percentage: z.number(),
})

export const creditCardBreakdownResponseSchema = z.object({
  data: z.array(creditCardBreakdownItemSchema),
  total: z.number().int().nonnegative(),
})

// Credit Card Utilization (FREE)
export const creditCardUtilizationItemSchema = z.object({
  credit_card_id: z.uuid(),
  name: z.string(),
  color: z.string(),
  bank: z.string(),
  flag: z.string(),
  used_cents: z.number().int().nonnegative(),
  limit_cents: z.number().int().nonnegative(),
  utilization_percent: z.number(),
})

export const creditCardUtilizationResponseSchema = z.object({
  data: z.array(creditCardUtilizationItemSchema),
})

// Recurring vs One-Time (FREE)
export const recurringVsOnetimeResponseSchema = z.object({
  recurring_amount: z.number().int().nonnegative(),
  onetime_amount: z.number().int().nonnegative(),
  recurring_percentage: z.number(),
  onetime_percentage: z.number(),
})

// Day of Week (PRO)
export const dayOfWeekDataPointSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  label: z.string(),
  average_amount: z.number().int().nonnegative(),
})

export const dayOfWeekResponseSchema = z.object({
  data: z.array(dayOfWeekDataPointSchema),
})

// Invoice Calendar (PRO)
export const invoiceCalendarItemSchema = z.object({
  credit_card_id: z.uuid(),
  credit_card_name: z.string(),
  color: z.string(),
  bank: z.string(),
  flag: z.string(),
  due_date: z.string(),
  total_cents: z.number().int().nonnegative(),
  paid_cents: z.number().int().nonnegative(),
  is_paid: z.boolean(),
})

export const invoiceCalendarResponseSchema = z.object({
  data: z.array(invoiceCalendarItemSchema),
})

// Spending Limit Progress (PRO)
export const spendingLimitProgressResponseSchema = z.object({
  spent_cents: z.number().int().nonnegative(),
  limit_cents: z.number().int().nonnegative(),
  percentage: z.number(),
  days_remaining: z.number().int().nonnegative(),
})

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
export type TimelineGroupBy = z.infer<typeof timelineGroupBySchema>
export type ExpensesTimelineQuery = z.infer<typeof expensesTimelineQuerySchema>
export type SummaryComparison = z.infer<typeof summaryComparisonSchema>
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
export type TimelineDataPoint = z.infer<typeof timelineDataPointSchema>
export type ExpensesTimelineResponse = z.infer<typeof expensesTimelineResponseSchema>
export type IncomeExpensesDataPoint = z.infer<typeof incomeExpensesDataPointSchema>
export type IncomeVsExpensesResponse = z.infer<typeof incomeVsExpensesResponseSchema>
export type CategoryBreakdownItem = z.infer<typeof categoryBreakdownItemSchema>
export type CategoryBreakdownResponse = z.infer<typeof categoryBreakdownResponseSchema>
export type PaymentBreakdownItem = z.infer<typeof paymentBreakdownItemSchema>
export type PaymentBreakdownResponse = z.infer<typeof paymentBreakdownResponseSchema>
export type SavingsRateDataPoint = z.infer<typeof savingsRateDataPointSchema>
export type SavingsRateResponse = z.infer<typeof savingsRateResponseSchema>
export type SalaryTimelineDataPoint = z.infer<typeof salaryTimelineDataPointSchema>
export type SalaryTimelineResponse = z.infer<typeof salaryTimelineResponseSchema>
export type InstallmentForecastMonth = z.infer<typeof installmentForecastMonthSchema>
export type InstallmentForecastResponse = z.infer<typeof installmentForecastResponseSchema>
export type CreditCardBreakdownItem = z.infer<typeof creditCardBreakdownItemSchema>
export type CreditCardBreakdownResponse = z.infer<typeof creditCardBreakdownResponseSchema>
export type CreditCardUtilizationItem = z.infer<typeof creditCardUtilizationItemSchema>
export type CreditCardUtilizationResponse = z.infer<typeof creditCardUtilizationResponseSchema>
export type RecurringVsOnetimeResponse = z.infer<typeof recurringVsOnetimeResponseSchema>
export type DayOfWeekDataPoint = z.infer<typeof dayOfWeekDataPointSchema>
export type DayOfWeekResponse = z.infer<typeof dayOfWeekResponseSchema>
export type InvoiceCalendarItem = z.infer<typeof invoiceCalendarItemSchema>
export type InvoiceCalendarResponse = z.infer<typeof invoiceCalendarResponseSchema>
export type SpendingLimitProgressResponse = z.infer<typeof spendingLimitProgressResponseSchema>

export const dashboardDataSchema = z.object({
  summary: dashboardSummarySchema,
  expensesTimeline: expensesTimelineResponseSchema,
  incomeVsExpenses: incomeVsExpensesResponseSchema.nullable(),
  categoryBreakdown: categoryBreakdownResponseSchema,
  paymentBreakdown: paymentBreakdownResponseSchema,
  creditCardBreakdown: creditCardBreakdownResponseSchema.nullable(),
  savingsRate: savingsRateResponseSchema.nullable(),
  salaryTimeline: salaryTimelineResponseSchema.nullable(),
  installmentForecast: installmentForecastResponseSchema.nullable(),
  creditCardUtilization: creditCardUtilizationResponseSchema,
  recurringVsOnetime: recurringVsOnetimeResponseSchema,
  dayOfWeek: dayOfWeekResponseSchema.nullable(),
  invoiceCalendar: invoiceCalendarResponseSchema.nullable(),
  spendingLimitProgress: spendingLimitProgressResponseSchema.nullable(),
})

export type DashboardData = z.infer<typeof dashboardDataSchema>
