import type { ExpenseForecastResponse } from '@plim/shared'
import type { DashboardRepository } from './dashboard.repository'

export class GetExpenseForecastUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(userId: string): Promise<ExpenseForecastResponse> {
    const { daily_expenses } = await this.dashboardRepository.getExpenseForecastData(userId)

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const totalSpentSoFar = Array.from(daily_expenses.values()).reduce(
      (sum, amount) => sum + amount,
      0
    )
    const daysWithData = today
    const dailyAverage = daysWithData > 0 ? totalSpentSoFar / daysWithData : 0

    const data: ExpenseForecastResponse['data'] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      if (day <= today) {
        data.push({
          date: dateStr,
          actual_amount: daily_expenses.get(dateStr) ?? 0,
          projected_amount: null,
        })
      } else {
        data.push({
          date: dateStr,
          actual_amount: null,
          projected_amount: Math.round(dailyAverage),
        })
      }
    }

    const projectedRemaining = Math.round(dailyAverage * (daysInMonth - today))
    const projectedEndOfMonth = totalSpentSoFar + projectedRemaining

    return { data, projected_end_of_month: projectedEndOfMonth }
  }
}
