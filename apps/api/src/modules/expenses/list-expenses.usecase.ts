import type { Expense, ExpenseFilters, PaginatedExpenseFilters, PaginationMeta } from '@plim/shared'
import type { ExpensesRepository } from './expenses.repository'

export interface PaginatedResult {
  data: Expense[]
  meta: PaginationMeta
}

export class ListExpensesUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, filters?: ExpenseFilters): Promise<Expense[]> {
    return this.expensesRepository.findByUserId(userId, filters)
  }

  async executePaginated(
    userId: string,
    filters: PaginatedExpenseFilters
  ): Promise<PaginatedResult> {
    const { page, limit, ...expenseFilters } = filters

    const { data, total } = await this.expensesRepository.findByUserIdPaginated(
      userId,
      expenseFilters,
      page,
      limit
    )

    const totalPages = Math.ceil(total / limit)

    return {
      data,
      meta: { page, limit, total, totalPages },
    }
  }
}
