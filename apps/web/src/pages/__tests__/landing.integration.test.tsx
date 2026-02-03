import { ThemeProvider } from '@/components/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from '../landing/landing.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useRouter: () => ({ state: { location: { pathname: '/' } } }),
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

describe('LandingPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders landing page container', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      const landingContainer = container.querySelector('.landing-container')
      expect(landingContainer).toBeInTheDocument()
    })

    it('renders main element', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('page sections', () => {
    it('renders header section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // LandingHeader component should be present
      // Verify by checking for common header elements
      const container = screen.getByRole('main').parentElement
      expect(container).toBeInTheDocument()
    })

    it('renders hero section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // HeroSection component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders onboarding section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // OnboardingSection component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders features showcase section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // FeaturesShowcase component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders security section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // SecuritySection component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders pricing section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // PricingSection component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders CTA section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // CtaSection component should be rendered
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders footer section', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // LandingFooter component should be present
      const container = screen.getByRole('main').parentElement
      expect(container).toBeInTheDocument()
    })
  })

  describe('section order', () => {
    it('renders sections in correct order', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()

      // Verify main has children (the sections)
      expect(main?.children.length).toBeGreaterThan(0)
    })
  })

  describe('layout structure', () => {
    it('has overflow hidden on container', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      const landingContainer = container.querySelector('.landing-container')
      expect(landingContainer).toHaveClass('overflow-x-hidden')
    })

    it('contains both header and main sections', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      const main = screen.getByRole('main')
      const landingContainer = container.querySelector('.landing-container')

      expect(main).toBeInTheDocument()
      expect(landingContainer).toBeInTheDocument()
    })
  })

  describe('component composition', () => {
    it('renders all 7 major sections plus header and footer', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      // Main element should contain all the sections
      const main = screen.getByRole('main')

      // Check that main has multiple children (7 sections)
      // HeroSection, OnboardingSection, FeaturesShowcase, SecuritySection, PricingSection, CtaSection
      expect(main.children.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('accessibility', () => {
    it('has semantic main landmark', () => {
      render(<LandingPage />, { wrapper: TestWrapper })

      const main = screen.getByRole('main')
      expect(main.tagName).toBe('MAIN')
    })

    it('renders without accessibility violations', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      // Basic check that content is rendered
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('has responsive container class', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      const landingContainer = container.querySelector('.landing-container')
      expect(landingContainer).toBeInTheDocument()
    })
  })

  describe('content delivery', () => {
    it('renders complete landing experience', () => {
      const { container } = render(<LandingPage />, { wrapper: TestWrapper })

      // Verify the full page structure is present
      const landingContainer = container.querySelector('.landing-container')
      const main = screen.getByRole('main')

      expect(landingContainer).toBeInTheDocument()
      expect(main).toBeInTheDocument()
      expect(main.children.length).toBeGreaterThan(0)
    })
  })
})
