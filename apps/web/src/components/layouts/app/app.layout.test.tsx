import { render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from './app.layout'

// Mock values
const mockOpen = vi.fn()
const mockUseLocation = vi.fn(() => ({ pathname: '/dashboard' }))
const mockProfile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  currency: 'BRL',
  locale: 'pt-BR',
  is_onboarded: true,
  referred_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => mockUseLocation(),
}))

// Mock hooks
vi.mock('@/hooks/use-profile', () => ({
  useProfile: vi.fn(() => ({
    profile: mockProfile,
    isLoading: false,
  })),
}))

vi.mock('@/stores/onboarding.store', () => ({
  useOnboardingStore: vi.fn(() => ({
    open: mockOpen,
  })),
}))

// Mock shadcn sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: PropsWithChildren) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({ children }: PropsWithChildren) => (
    <div data-testid="sidebar-inset">{children}</div>
  ),
  useSidebar: () => ({
    isMobile: false,
    setOpenMobile: vi.fn(),
  }),
}))

// Mock layout components
vi.mock('./app-sidebar', () => ({
  AppSidebar: () => <aside data-testid="app-sidebar">Sidebar</aside>,
}))

vi.mock('./site-header', () => ({
  SiteHeader: ({ title }: { title?: string }) => (
    <header data-testid="site-header">{title || 'Header'}</header>
  ),
}))

// Mock onboarding overlay - note the correct path is @/components/onboarding
vi.mock('@/components/onboarding', () => ({
  OnboardingOverlay: () => <div data-testid="onboarding-overlay">Onboarding</div>,
}))

// Mock renewal reminder modal
vi.mock('@/components/renewal-reminder-modal', () => ({
  RenewalReminderModal: () => <div data-testid="renewal-reminder-modal">Renewal Modal</div>,
}))

// Mock AI components
vi.mock('@/components/ai', () => ({
  AIChatButton: () => <div data-testid="ai-chat-button">AI Chat Button</div>,
  AIChatDrawer: () => <div data-testid="ai-chat-drawer">AI Chat Drawer</div>,
}))

// Mock useAIUsage hook
vi.mock('@/hooks/use-ai-usage', () => ({
  useAIUsage: vi.fn(),
}))

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
  })

  describe('normal rendering', () => {
    it('renders children when profile is loaded', () => {
      render(
        <AppLayout>
          <div data-testid="main-content">Main Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    it('renders sidebar provider', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    })

    it('renders app sidebar', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    })

    it('renders site header', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('site-header')).toBeInTheDocument()
    })

    it('renders sidebar inset', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    })

    it('renders onboarding overlay', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument()
    })
  })

  describe('page titles', () => {
    it('displays dashboard title on dashboard route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('displays expenses title on expenses route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/expenses' })

      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByText('Transações')).toBeInTheDocument()
    })

    it('displays no title for unknown routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown' })

      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      // Header is rendered but with default "Header" text
      expect(screen.getByTestId('site-header')).toHaveTextContent('Header')
    })
  })

  describe('layout structure', () => {
    it('wraps content in proper flex container', () => {
      render(
        <AppLayout>
          <div data-testid="child-content">Content</div>
        </AppLayout>
      )

      const contentWrapper = screen.getByTestId('child-content').closest('div.flex')
      expect(contentWrapper).toHaveClass('flex-1', 'flex-col', 'gap-4', 'p-4', 'pt-0')
    })

    it('maintains proper nesting order', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      const provider = screen.getByTestId('sidebar-provider')
      const sidebar = screen.getByTestId('app-sidebar')
      const inset = screen.getByTestId('sidebar-inset')
      const header = screen.getByTestId('site-header')

      // Sidebar should be a child of provider
      expect(provider).toContainElement(sidebar)
      // Inset should also be a child of provider
      expect(provider).toContainElement(inset)
      // Header should be inside inset
      expect(inset).toContainElement(header)
    })
  })

  describe('children rendering', () => {
    it('renders single child component', () => {
      render(
        <AppLayout>
          <div data-testid="single-child">Single</div>
        </AppLayout>
      )

      expect(screen.getByTestId('single-child')).toBeInTheDocument()
    })

    it('renders multiple children components', () => {
      render(
        <AppLayout>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </AppLayout>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('handles null children gracefully', () => {
      render(<AppLayout>{null}</AppLayout>)

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('provides proper semantic structure with aside landmark', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    })

    it('provides proper semantic structure with header', () => {
      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      )

      expect(screen.getByTestId('site-header')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('renders without errors when children is undefined', () => {
      render(<AppLayout>{undefined}</AppLayout>)

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    })
  })
})
