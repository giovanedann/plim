import type { Expense, ExpenseFilters } from '@myfinances/shared'
import type { ExpensesRepository } from './expenses.repository'

export interface ProjectedExpense extends Expense {
  is_projected: boolean
  source_expense_id?: string
}

export class ListExpensesUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, filters?: ExpenseFilters): Promise<ProjectedExpense[]> {
    const expenses = await this.expensesRepository.findByUserId(userId, filters)

    const regularExpenses: ProjectedExpense[] = expenses
      .filter((e) => !e.is_recurrent)
      .map((e) => ({ ...e, is_projected: false }))

    if (!filters?.start_date || !filters?.end_date) {
      const recurrentExpenses: ProjectedExpense[] = expenses
        .filter((e) => e.is_recurrent)
        .map((e) => ({ ...e, is_projected: false }))
      return [...regularExpenses, ...recurrentExpenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }

    const recurrentExpenses = await this.expensesRepository.findRecurrentByUserId(userId)
    const projectedExpenses = this.projectRecurrentExpenses(
      recurrentExpenses,
      filters.start_date,
      filters.end_date,
      filters
    )

    return [...regularExpenses, ...projectedExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  private projectRecurrentExpenses(
    recurrentExpenses: Expense[],
    startDate: string,
    endDate: string,
    filters?: ExpenseFilters
  ): ProjectedExpense[] {
    const projected: ProjectedExpense[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (const expense of recurrentExpenses) {
      if (filters?.category_id && expense.category_id !== filters.category_id) {
        continue
      }
      if (filters?.payment_method && expense.payment_method !== filters.payment_method) {
        continue
      }

      const recurrenceStart = expense.recurrence_start ? new Date(expense.recurrence_start) : null
      const recurrenceEnd = expense.recurrence_end ? new Date(expense.recurrence_end) : null
      const recurrenceDay = expense.recurrence_day

      if (!recurrenceDay || !recurrenceStart) continue

      const effectiveStart = recurrenceStart > start ? recurrenceStart : start
      const effectiveEnd = recurrenceEnd && recurrenceEnd < end ? recurrenceEnd : end

      const currentDate = new Date(effectiveStart)
      currentDate.setDate(1)

      while (currentDate <= effectiveEnd) {
        const projectedDate = this.getDateForDay(currentDate, recurrenceDay)

        if (projectedDate >= effectiveStart && projectedDate <= effectiveEnd) {
          projected.push({
            ...expense,
            id: `${expense.id}_${projectedDate.toISOString().slice(0, 10)}`,
            date: projectedDate.toISOString().slice(0, 10),
            is_projected: true,
            source_expense_id: expense.id,
          })
        }

        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }

    return projected
  }

  private getDateForDay(referenceDate: Date, day: number): Date {
    const year = referenceDate.getFullYear()
    const month = referenceDate.getMonth()
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const actualDay = Math.min(day, lastDayOfMonth)

    return new Date(year, month, actualDay)
  }
}
