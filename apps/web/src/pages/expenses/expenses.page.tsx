import { ExpenseChart } from './components/expense-chart'
import { ExpenseFilters } from './components/expense-filters'
import { ExpenseTable } from './components/expense-table'
import { MonthSelector } from './components/month-selector'
import { PaginationControls } from './components/pagination-controls'
import { SalaryDisplay } from './components/salary-display'
import { SpendingLimitCard } from './components/spending-limit-card'
import { useExpensesPage } from './use-expenses.page'

export function ExpensesPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    filters,
    setFilters,
    expenses,
    allExpenses,
    categories,
    creditCards,
    salary,
    spendingLimit,
    isLoading,
    totalExpenses,
    totalIncomes,
    netCost,
    balance,
    comparison,
    setPage,
    paginationMeta,
  } = useExpensesPage()

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">Gerencie suas transações mensais</p>
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      <div className="px-4 lg:px-6">
        <SalaryDisplay
          salary={salary}
          totalExpenses={totalExpenses}
          totalIncomes={totalIncomes}
          netCost={netCost}
          balance={balance}
          selectedMonth={selectedMonth}
          isLoading={isLoading}
          comparison={comparison}
        />
      </div>

      <div className="px-4 lg:px-6">
        <SpendingLimitCard
          spendingLimit={spendingLimit}
          netCost={netCost}
          selectedMonth={selectedMonth}
          isLoading={isLoading}
        />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseChart expenses={allExpenses} selectedMonth={selectedMonth} isLoading={isLoading} />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          creditCards={creditCards}
          selectedMonth={selectedMonth}
          spendingLimit={spendingLimit}
          netCost={netCost}
        />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseTable
          expenses={expenses}
          categories={categories}
          creditCards={creditCards}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
          spendingLimit={spendingLimit}
          netCost={netCost}
        />
      </div>

      {paginationMeta && (
        <div className="px-4 lg:px-6">
          <PaginationControls meta={paginationMeta} onPageChange={setPage} isLoading={isLoading} />
        </div>
      )}
    </div>
  )
}
