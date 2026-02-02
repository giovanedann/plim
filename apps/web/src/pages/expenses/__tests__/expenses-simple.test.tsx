import {
  createMockApiPaginatedResponse,
  createMockApiResponse,
  createTestRouter,
  mockApiResponse,
  resetApiMocks,
} from '@/test-utils/ui-integration'
import { RouterProvider } from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ExpensesPage Simple Diagnostic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetApiMocks()
    vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders something', async () => {
    // Set up minimal mocks
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

    console.log('Router state before render:', router.state.location.pathname)

    const { container } = render(<RouterProvider router={router} />, { wrapper })

    // Wait a bit for initial render
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Log what's rendered
    console.log('Container HTML length:', container.innerHTML.length)
    console.log('Container HTML:', container.innerHTML.slice(0, 1000))

    // Check if there's any div
    const anyDiv = container.querySelector('div')
    console.log('Found any div?', !!anyDiv)

    // Check router state after render
    console.log('Router state after render:', router.state.location.pathname)
    console.log(
      'Router matches:',
      router.state.matches.map((m) => m.routeId)
    )

    // Wait for any content to appear
    await waitFor(
      () => {
        const text = container.textContent
        console.log('Container text content:', text?.slice(0, 200))
        expect(text).toBeTruthy()
        expect(text.length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
  })
})
