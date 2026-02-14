import type {
  DashboardData,
  ExpensesTimelineResponse,
  IncomeVsExpensesResponse,
  InstallmentForecastResponse,
  SalaryTimelineResponse,
  SavingsRateResponse,
} from '@plim/shared'

function filterExpensesTimeline(timeline: ExpensesTimelineResponse): ExpensesTimelineResponse {
  return {
    ...timeline,
    data: timeline.data.filter((point) => point.amount > 0),
  }
}

function filterIncomeVsExpenses(
  data: IncomeVsExpensesResponse | null
): IncomeVsExpensesResponse | null {
  if (!data) return null
  return {
    ...data,
    data: data.data.filter((point) => point.income > 0 || point.expenses > 0),
  }
}

function filterSavingsRate(data: SavingsRateResponse | null): SavingsRateResponse | null {
  if (!data) return null
  return {
    ...data,
    data: data.data.filter((point) => point.rate !== 0),
  }
}

function filterSalaryTimeline(data: SalaryTimelineResponse | null): SalaryTimelineResponse | null {
  if (!data) return null
  return {
    ...data,
    data: data.data.filter((point) => point.amount > 0),
  }
}

function filterInstallmentForecast(
  data: InstallmentForecastResponse | null
): InstallmentForecastResponse | null {
  if (!data) return null
  return {
    ...data,
    data: data.data.filter((point) => point.total > 0),
  }
}

export function filterEmptyPeriods(data: DashboardData): DashboardData {
  return {
    ...data,
    expensesTimeline: filterExpensesTimeline(data.expensesTimeline),
    incomeVsExpenses: filterIncomeVsExpenses(data.incomeVsExpenses),
    savingsRate: filterSavingsRate(data.savingsRate),
    salaryTimeline: filterSalaryTimeline(data.salaryTimeline),
    installmentForecast: filterInstallmentForecast(data.installmentForecast),
  }
}
