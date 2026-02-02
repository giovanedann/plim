import {
  createMockApiPaginatedResponse,
  createMockApiResponse,
  createMockExpense,
  createTestRouter,
  mockApiResponse,
  resetApiMocks,
} from '@/test-utils/ui-integration'
import { RouterProvider } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ExpensesPage Minimal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders empty state', async () => {
    // Mock all required endpoints
    mockApiResponse(
      '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20',
      createMockApiPaginatedResponse([], { page: 1, limit: 20, total: 0 })
    )
    mockApiResponse(
      '/expenses?start_date=2024-01-01&end_date=2024-01-31',
      createMockApiResponse([])
    )
    mockApiResponse('/categories', createMockApiResponse([]))
    mockApiResponse('/credit-cards', createMockApiResponse([]))
    mockApiResponse('/salary?month=2024-01', createMockApiResponse(null))
    mockApiResponse('/spending-limits?month=2024-01', createMockApiResponse(null))
    mockApiResponse(
      '/expenses?start_date=2023-12-01&end_date=2023-12-31',
      createMockApiResponse([])
    )
    mockApiResponse('/salary?month=2023-12', createMockApiResponse(null))
    mockApiResponse('/profile', createMockApiResponse(null))

    const { router, wrapper } = createTestRouter({ initialRoute: '/expenses' })
    render(<RouterProvider router={router} />, { wrapper })

    // Wait for loading to finish and empty state to appear
    await waitFor(
      () => {
        const emptyText = screen.queryByText(/Nenhuma despesa encontrada/i)
        if (!emptyText) {
          // Log what we do have
          console.log('Current page text:', document.body.textContent?.slice(0, 500))
        }
        expect(emptyText).toBeInTheDocument()
      },
      { timeout: 10000 }
    )
  })

  it('renders one expense', async () => {
    const expense = createMockExpense({
      description: 'Test Expense',
      amount_cents: 5000,
      date: '2024-01-15',
    })

    mockApiResponse(
      '/expenses/paginated?start_date=2024-01-01&end_date=2024-01-31&page=1&limit=20',
      createMockApiPaginatedResponse([expense], { page: 1, limit: 20, total: 1 })
    )
    mockApiResponse(
      '/expenses?start_date=2024-01-01&end_date=2024-01-31',
      createMockApiResponse([expense])
    )
    mockApiResponse('/categories', createMockApiResponse([]))
    mockApiResponse('/credit-cards', createMockApiResponse([]))
    mockApiResponse('/salary?month=2024-01', createMockApiResponse(null))
    mockApiResponse('/spending-limits?month=2024-01', createMockApiResponse(null))
    mockApiResponse(
      '/expenses?start_date=2023-12-01&end_date=2023-12-31',
      createMockApiResponse([])
    )
    mockApiResponse('/salary?month=2023-12', createMockApiResponse(null))
    mockApiResponse('/profile', createMockApiResponse(null))

    const { router, wrapper } = createTestRouter({ initialRoute: '/expenses' })
    render(<RouterProvider router={router} />, { wrapper })

    await waitFor(
      () => {
        const expenseText = screen.queryByText('Test Expense')
        if (!expenseText) {
          console.log('Current page text:', document.body.textContent?.slice(0, 500))
          console.log('[FETCH] logs would appear here if fetch was called')
        }
        expect(expenseText).toBeInTheDocument()
      },
      { timeout: 10000 }
    )
  })
})
