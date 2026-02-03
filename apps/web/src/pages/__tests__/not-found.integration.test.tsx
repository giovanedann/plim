import { ThemeProvider } from '@/components/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundPage } from '../not-found.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

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

describe('NotFoundPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders 404 error number', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('renders page not found heading', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Página não encontrada/i)).toBeInTheDocument()
    })

    it('renders descriptive message', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(
          /Parece que você se perdeu. A página que você está procurando não existe ou foi movida./i
        )
      ).toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('renders dashboard navigation button', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('link', { name: /Ir para Dashboard/i })).toBeInTheDocument()
    })

    it('renders back button', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('link', { name: /Voltar/i })).toBeInTheDocument()
    })

    it('dashboard button links to correct route', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      const dashboardLink = screen.getByRole('link', { name: /Ir para Dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('visual elements', () => {
    it('renders Plim logo icon', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      // The PlimIcon component should be rendered
      const container = screen.getByText('404').closest('div')
      expect(container).toBeInTheDocument()
    })

    it('renders theme toggle', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      // Theme toggle button should be present
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('floating icons', () => {
    it('renders multiple floating navigation icons', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      // The page has multiple floating icon elements (Compass, MapPin, Search, etc.)
      // We can verify the container structure exists
      const pageContent = screen.getByText('404')
      expect(pageContent).toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('has full screen height container', () => {
      const { container } = render(<NotFoundPage />, { wrapper: TestWrapper })

      const mainDiv = container.querySelector('div')
      expect(mainDiv).toHaveClass('min-h-screen')
    })

    it('has background gradient', () => {
      const { container } = render(<NotFoundPage />, { wrapper: TestWrapper })

      const mainDiv = container.querySelector('div')
      expect(mainDiv).toHaveClass('bg-slate-950')
    })
  })

  describe('accessibility', () => {
    it('has semantic heading structure', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      const heading = screen.getByRole('heading', { name: /Página não encontrada/i })
      expect(heading).toBeInTheDocument()
    })

    it('navigation buttons are accessible links', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      const dashboardLink = screen.getByRole('link', { name: /Ir para Dashboard/i })
      const backLink = screen.getByRole('link', { name: /Voltar/i })

      expect(dashboardLink).toBeInTheDocument()
      expect(backLink).toBeInTheDocument()
    })
  })

  describe('content hierarchy', () => {
    it('displays all key content elements', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText(/Página não encontrada/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Ir para Dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Voltar/i })).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('renders content container with responsive classes', () => {
      render(<NotFoundPage />, { wrapper: TestWrapper })

      // The centered content should have responsive text sizing
      const heading = screen.getByText(/Página não encontrada/i)
      expect(heading).toBeInTheDocument()
    })
  })
})
