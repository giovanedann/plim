import { ExpenseChart } from './components/expense-chart'
import { ExpenseFilters } from './components/expense-filters'
import { ExpenseTable } from './components/expense-table'
import { MonthSelector } from './components/month-selector'
import { SalaryDisplay } from './components/salary-display'
import { useExpensesPage } from './use-expenses.page'

export function ExpensesPage() {
  const {
    selectedMonth,
    setSelectedMonth,
    filters,
    setFilters,
    expenses,
    categories,
    salary,
    isLoading,
    totalExpenses,
    balance,
    comparison,
  } = useExpensesPage()

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-sm text-muted-foreground">Gerencie suas despesas mensais</p>
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      <div className="px-4 lg:px-6">
        <SalaryDisplay
          salary={salary}
          totalExpenses={totalExpenses}
          balance={balance}
          selectedMonth={selectedMonth}
          isLoading={isLoading}
          comparison={comparison}
        />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseChart expenses={expenses} selectedMonth={selectedMonth} isLoading={isLoading} />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          selectedMonth={selectedMonth}
        />
      </div>

      <div className="px-4 lg:px-6">
        <ExpenseTable
          expenses={expenses}
          categories={categories}
          isLoading={isLoading}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  )
}
