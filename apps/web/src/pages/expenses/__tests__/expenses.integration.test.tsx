import { ThemeProvider } from '@/components/theme-provider'
import { categoryService } from '@/services/category.service'
import { creditCardService } from '@/services/credit-card.service'
import { expenseService } from '@/services/expense.service'
import { salaryService } from '@/services/salary.service'
import { spendingLimitService } from '@/services/spending-limit.service'
import {
  createMockCategory,
  createMockExpense,
  createMockSalaryHistory,
  resetIdCounter,
} from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpensesPage } from '../expenses.page'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

function setupBasicServiceMocks() {
  vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })
  vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })
  vi.spyOn(salaryService, 'getSalary').mockResolvedValue({ data: null } as any)
  vi.spyOn(spendingLimitService, 'getSpendingLimit').mockResolvedValue({ data: null } as any)
}

describe('ExpensesPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetIdCounter()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('basic rendering', () => {
    it('renders page description', async () => {
      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Gerencie suas despesas mensais/i)).toBeInTheDocument()
      })
    })

    it('shows empty state when no expenses exist', async () => {
      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Nenhuma despesa ou receita encontrada/i)).toBeInTheDocument()
      })
    })

    it('renders expenses in table when data loads', async () => {
      const mockExpenses = [
        createMockExpense({
          description: 'Lunch at restaurant',
          amount_cents: 5000,
          date: '2024-01-15',
        }),
        createMockExpense({
          description: 'Coffee',
          amount_cents: 1500,
          date: '2024-01-16',
        }),
      ]

      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: mockExpenses,
        meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: mockExpenses })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Lunch at restaurant')).toBeInTheDocument()
        expect(screen.getByText('Coffee')).toBeInTheDocument()
      })
    })
  })

  describe('expense filtering', () => {
    it('displays category filter', async () => {
      const mockCategory = createMockCategory({ name: 'Food', icon: 'utensils' })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [mockCategory] })
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })
      vi.spyOn(salaryService, 'getSalary').mockResolvedValue({ data: null } as any)
      vi.spyOn(spendingLimitService, 'getSpendingLimit').mockResolvedValue({ data: null } as any)
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Categoria')).toBeInTheDocument()
      })
    })

    it('displays payment method filter', async () => {
      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument()
      })
    })
  })

  describe('expense CRUD operations', () => {
    it('shows create expense button', async () => {
      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Nova Transação')).toBeInTheDocument()
      })
    })

    it('shows edit and delete options for expenses', async () => {
      const mockExpense = createMockExpense({
        description: 'Test Expense',
        amount_cents: 5000,
      })

      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [mockExpense],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [mockExpense] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Test Expense')).toBeInTheDocument()
      })

      // Dropdown menu button has sr-only text "Abrir menu"
      const menuButton = screen.getByRole('button', { name: /abrir menu/i })
      await user.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText(/Editar/i)).toBeInTheDocument()
        expect(screen.getByText(/Excluir/i)).toBeInTheDocument()
      })
    })
  })

  describe('monthly navigation', () => {
    it('shows month selector', async () => {
      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Janeiro\/2024/i)).toBeInTheDocument()
      })
    })
  })

  describe('pagination', () => {
    it('shows pagination when there are multiple pages', async () => {
      const mockExpenses = Array.from({ length: 20 }, (_, i) =>
        createMockExpense({
          description: `Expense ${i + 1}`,
          amount_cents: 1000 * (i + 1),
        })
      )

      setupBasicServiceMocks()
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: mockExpenses,
        meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: mockExpenses })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Anterior')).toBeInTheDocument()
        expect(screen.getByText('Próximo')).toBeInTheDocument()
      })
    })
  })

  describe('financial summary', () => {
    it('displays salary card when available', async () => {
      const mockSalary = createMockSalaryHistory({
        amount_cents: 500000,
        effective_from: '2024-01-01',
      })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })
      vi.spyOn(salaryService, 'getSalary').mockResolvedValue({ data: mockSalary })
      vi.spyOn(spendingLimitService, 'getSpendingLimit').mockResolvedValue({ data: null } as any)
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Salário')).toBeInTheDocument()
        // With 0 expenses: both salary and balance show R$ 5.000,00
        expect(screen.getAllByText('R$ 5.000,00')).toHaveLength(2)
      })
    })

    it('displays spending limit card when available', async () => {
      const mockLimit = {
        year_month: '2024-01',
        amount_cents: 300000,
        is_carried_over: false,
        source_month: null,
      }

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })
      vi.spyOn(creditCardService, 'listCreditCards').mockResolvedValue({ data: [] })
      vi.spyOn(salaryService, 'getSalary').mockResolvedValue({ data: null } as any)
      vi.spyOn(spendingLimitService, 'getSpendingLimit').mockResolvedValue({ data: mockLimit })
      vi.spyOn(expenseService, 'listExpensesPaginated').mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })
      vi.spyOn(expenseService, 'listExpenses').mockResolvedValue({ data: [] })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Limite de Gastos')).toBeInTheDocument()
        expect(screen.getByText(/de R\$ 3\.000,00/)).toBeInTheDocument()
      })
    })
  })
})
