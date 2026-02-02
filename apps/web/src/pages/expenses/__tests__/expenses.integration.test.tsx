/**
 * Expenses Page Integration Tests
 *
 * Tests the integration between:
 * - ExpensesPage component
 * - useExpensesPage hook
 * - API services (mocked)
 * - React Query state management
 *
 * These tests verify that the page correctly:
 * - Displays expenses from API
 * - Handles loading states
 * - Filters expenses
 * - Renders empty states
 */

import { ThemeProvider } from '@/components/theme-provider'
import {
  createMockApiPaginatedResponse,
  createMockApiResponse,
  createMockCategory,
  createMockExpense,
  mockApiResponse,
  resetApiMocks,
} from '@/test-utils/ui-integration'
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

function setupBasicMocks(additionalMocks: Record<string, unknown> = {}) {
  mockApiResponse('/categories', createMockApiResponse([]))
  mockApiResponse('/credit-cards', createMockApiResponse([]))
  mockApiResponse('/salary?month=2024-01', createMockApiResponse(null))
  mockApiResponse('/spending-limits?month=2024-01', createMockApiResponse(null))
  mockApiResponse('/expenses?start_date=2023-12-01&end_date=2023-12-31', createMockApiResponse([]))
  mockApiResponse('/salary?month=2023-12', createMockApiResponse(null))

  Object.entries(additionalMocks).forEach(([endpoint, response]) => {
    mockApiResponse(endpoint, response)
  })
}

describe('ExpensesPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetApiMocks()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic rendering', () => {
    it('renders page description', async () => {
      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Gerencie suas despesas mensais/i)).toBeInTheDocument()
      })
    })

    it('shows empty state when no expenses exist', async () => {
      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Nenhuma despesa encontrada/i)).toBeInTheDocument()
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

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse(mockExpenses, { page: 1, limit: 20, total: 2 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse(mockExpenses),
      })

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

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
        '/categories': createMockApiResponse([mockCategory]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const categoryFilter = screen.getByRole('combobox', { name: /categoria/i })
        expect(categoryFilter).toBeInTheDocument()
      })
    })

    it('displays payment method filter', async () => {
      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const paymentFilter = screen.getByRole('combobox', { name: /forma de pagamento/i })
        expect(paymentFilter).toBeInTheDocument()
      })
    })
  })

  describe('expense CRUD operations', () => {
    it('shows create expense button', async () => {
      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar despesa/i })).toBeInTheDocument()
      })
    })

    it('shows edit and delete options for expenses', async () => {
      const mockExpense = createMockExpense({
        description: 'Test Expense',
        amount_cents: 5000,
      })

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([mockExpense], { page: 1, limit: 20, total: 1 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([mockExpense]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Test Expense')).toBeInTheDocument()
      })

      // Click the more options button
      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)

      // Check for edit and delete options
      await waitFor(() => {
        expect(screen.getByText(/Editar/i)).toBeInTheDocument()
        expect(screen.getByText(/Excluir/i)).toBeInTheDocument()
      })
    })
  })

  describe('monthly navigation', () => {
    it('shows month selector', async () => {
      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Month selector shows current month
        expect(screen.getByRole('button', { name: /janeiro 2024/i })).toBeInTheDocument()
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

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse(mockExpenses, { page: 1, limit: 20, total: 50 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse(mockExpenses),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Check if pagination controls appear
        expect(screen.getByText(/Página 1 de 3/i)).toBeInTheDocument()
      })
    })
  })

  describe('financial summary', () => {
    it('displays salary card when available', async () => {
      const mockSalary = { amount_cents: 500000, month: '2024-01' }

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
        '/salary?month=2024-01': createMockApiResponse(mockSalary),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Salary display shows formatted amount
        expect(screen.getByText(/R\$ 5\.000,00/i)).toBeInTheDocument()
      })
    })

    it('displays spending limit card when available', async () => {
      const mockLimit = {
        month: '2024-01',
        amount_cents: 300000,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      setupBasicMocks({
        '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20':
          createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 }),
        '/expenses?start_date=2024-01-01&end_date=2024-01-31': createMockApiResponse([]),
        '/spending-limits?month=2024-01': createMockApiResponse(mockLimit),
      })

      render(<ExpensesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Spending limit card shows formatted amount
        expect(screen.getByText(/R\$ 3\.000,00/i)).toBeInTheDocument()
      })
    })
  })
})
