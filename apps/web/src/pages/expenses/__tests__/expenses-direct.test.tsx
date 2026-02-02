import { ThemeProvider } from '@/components/theme-provider'
import {
  createMockApiPaginatedResponse,
  createMockApiResponse,
  mockApiResponse,
  resetApiMocks,
} from '@/test-utils/ui-integration'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('ExpensesPage Direct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders page description', async () => {
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

    render(<ExpensesPage />, { wrapper: TestWrapper })

    // Just check if the page rendered at all
    await waitFor(
      () => {
        const pageDescription = screen.queryByText(/Gerencie suas despesas mensais/i)
        if (!pageDescription) {
          console.log('[DIRECT] Page text:', document.body.textContent?.slice(0, 500))
        }
        expect(pageDescription).toBeInTheDocument()
      },
      { timeout: 10000 }
    )
  })
})
