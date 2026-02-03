import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteHeader } from './site-header'

// Mock shadcn/ui sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: (props: any) => (
    <button data-testid="sidebar-trigger" {...props}>
      Toggle Sidebar
    </button>
  ),
}))

// Mock shadcn/ui separator component
vi.mock('@/components/ui/separator', () => ({
  Separator: ({ orientation, ...props }: any) => (
    <hr data-testid="separator" data-orientation={orientation} {...props} />
  ),
}))

// Mock ThemeToggle component - note the path is components/ui/theme-toggle, not components/theme-toggle
vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => (
    <button type="button" data-testid="theme-toggle">
      Toggle Theme
    </button>
  ),
}))

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders header element', () => {
      const { container } = render(<SiteHeader />)

      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    it('renders sidebar trigger button', () => {
      render(<SiteHeader />)

      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
    })

    it('renders separator', () => {
      render(<SiteHeader />)

      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
      expect(separator).toHaveAttribute('data-orientation', 'vertical')
    })

    it('renders theme toggle', () => {
      render(<SiteHeader />)

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  describe('title prop', () => {
    it('displays title when provided', () => {
      render(<SiteHeader title="Dashboard" />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('does not display title when not provided', () => {
      render(<SiteHeader />)

      const heading = screen.queryByRole('heading', { level: 1 })
      expect(heading).not.toBeInTheDocument()
    })

    it('renders title as h1 heading', () => {
      render(<SiteHeader title="My Page" />)

      const heading = screen.getByRole('heading', { level: 1, name: 'My Page' })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('layout and structure', () => {
    it('applies correct layout classes', () => {
      const { container } = render(<SiteHeader />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('flex', 'h-16', 'shrink-0', 'items-center', 'gap-2', 'border-b')
    })

    it('renders elements in correct order', () => {
      render(<SiteHeader title="Test" />)

      const header = screen.getByRole('banner')
      const children = Array.from(header.querySelectorAll('*'))

      // Sidebar trigger should come before separator
      const triggerIndex = children.findIndex(
        (el) => el.getAttribute('data-testid') === 'sidebar-trigger'
      )
      const separatorIndex = children.findIndex(
        (el) => el.getAttribute('data-testid') === 'separator'
      )

      expect(triggerIndex).toBeLessThan(separatorIndex)
    })

    it('places theme toggle at the end', () => {
      render(<SiteHeader />)

      const themeToggle = screen.getByTestId('theme-toggle')
      const parent = themeToggle.closest('div')

      expect(parent).toHaveClass('ml-auto')
    })
  })

  describe('accessibility', () => {
    it('renders as banner landmark', () => {
      render(<SiteHeader />)

      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('has proper heading hierarchy when title is provided', () => {
      render(<SiteHeader title="Dashboard" />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Dashboard')
    })
  })

  describe('responsive behavior', () => {
    it('applies responsive padding classes', () => {
      const { container } = render(<SiteHeader />)

      const innerDiv = container.querySelector('.px-4')
      expect(innerDiv).toBeInTheDocument()
      expect(innerDiv).toHaveClass('lg:px-6')
    })

    it('ensures full width layout', () => {
      const { container } = render(<SiteHeader />)

      const innerDiv = container.querySelector('.w-full')
      expect(innerDiv).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty title string', () => {
      render(<SiteHeader title="" />)

      const heading = screen.queryByRole('heading', { level: 1 })
      expect(heading).not.toBeInTheDocument()
    })

    it('handles very long titles', () => {
      const longTitle = 'This is a very long page title that might overflow'
      render(<SiteHeader title={longTitle} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('renders without title and maintains structure', () => {
      const { container } = render(<SiteHeader />)

      expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
      expect(screen.getByTestId('separator')).toBeInTheDocument()
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()

      const header = container.querySelector('header')
      expect(header?.children.length).toBeGreaterThan(0)
    })
  })
})
