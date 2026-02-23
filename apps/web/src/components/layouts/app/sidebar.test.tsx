import { ThemeProvider } from '@/components/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { profileService } from '@/services/profile.service'
import type { Profile } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSidebar } from './app-sidebar'
import { SiteHeader } from './site-header'

// Mock services
vi.mock('@/services/profile.service', () => ({
  profileService: {
    getProfile: vi.fn(),
  },
}))

// Mock auth store
const mockSignOut = vi.fn()
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-123',
      email: 'john@example.com',
      user_metadata: {},
    },
    signOut: mockSignOut,
    isInitialized: true,
  }),
}))

// Mock router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/dashboard' }),
}))

const mockProfile: Profile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: null,
  currency: 'BRL',
  locale: 'pt-BR',
  is_onboarded: true,
  referred_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function TestLayout({ children }: { children?: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader title="Test Page" />
            <div className="flex flex-1 flex-col gap-4 p-4">
              {children || <h1>Test Content</h1>}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

describe('Sidebar Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()

    // Mock profile service
    vi.mocked(profileService.getProfile).mockResolvedValue({
      data: mockProfile,
    })
  })

  describe('navigation rendering', () => {
    it('renders all navigation links', async () => {
      render(<TestLayout />)

      expect(await screen.findByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /transações/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /categorias/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /cartões/i })).toBeInTheDocument()
    })

    it('renders application branding', async () => {
      render(<TestLayout />)

      expect(await screen.findByText('Plim')).toBeInTheDocument()
      expect(screen.getByText('Finanças pessoais')).toBeInTheDocument()
    })

    it('navigation links have correct hrefs', async () => {
      render(<TestLayout />)

      const dashboardLink = await screen.findByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')

      const expensesLink = screen.getByRole('link', { name: /transações/i })
      expect(expensesLink).toHaveAttribute('href', '/expenses')
    })
  })

  describe('user dropdown', () => {
    it('displays user information', async () => {
      render(<TestLayout />)

      expect(await screen.findByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('shows user initial when no avatar', async () => {
      render(<TestLayout />)

      await screen.findByText('John Doe')
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      render(<TestLayout />)

      const userButton = await screen.findByText('John Doe')
      await user.click(userButton.closest('button')!)

      expect(screen.getByText('Minha conta')).toBeInTheDocument()
      expect(screen.getByText('Perfil')).toBeInTheDocument()
      expect(screen.getByText('Sair')).toBeInTheDocument()
    })

    it('calls signOut when logout clicked', async () => {
      render(<TestLayout />)

      const userButton = await screen.findByText('John Doe')
      await user.click(userButton.closest('button')!)

      const logoutButton = screen.getByText('Sair')
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('profile link navigates to profile page', async () => {
      render(<TestLayout />)

      const userButton = await screen.findByText('John Doe')
      await user.click(userButton.closest('button')!)

      const profileLink = screen.getByText('Perfil').closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })
  })

  describe('sidebar toggle', () => {
    it('renders toggle button', async () => {
      render(<TestLayout />)

      const triggers = await screen.findAllByRole('button', { name: /toggle sidebar/i })
      expect(triggers.length).toBeGreaterThan(0)
    })

    it('toggle is keyboard accessible', async () => {
      render(<TestLayout />)

      const triggers = await screen.findAllByRole('button', { name: /toggle sidebar/i })
      const trigger = triggers[0]!

      trigger.focus()
      expect(trigger).toHaveFocus()
    })
  })

  describe('layout structure', () => {
    it('renders main content alongside sidebar', async () => {
      render(
        <TestLayout>
          <div>Custom Content</div>
        </TestLayout>
      )

      // Both sidebar and content should be visible
      expect(await screen.findByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Custom Content')).toBeInTheDocument()
    })

    it('renders page header', async () => {
      render(<TestLayout />)

      const header = await screen.findByRole('banner')
      expect(header).toBeInTheDocument()
      expect(header).toHaveTextContent('Test Page')
    })
  })

  describe('accessibility', () => {
    it('all navigation links are keyboard accessible', async () => {
      render(<TestLayout />)

      const links = await screen.findAllByRole('link')
      for (const link of links) {
        expect(link).toHaveAttribute('href')
      }
    })

    it('has proper landmark structure', async () => {
      render(<TestLayout />)

      // Header landmark
      const header = await screen.findByRole('banner')
      expect(header).toBeInTheDocument()

      // Navigation exists (verified by presence of nav links)
      const links = await screen.findAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('theme toggle', () => {
    it('renders theme toggle button', async () => {
      render(<TestLayout />)

      const themeToggle = await screen.findByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
    })

    it('theme toggle is in header', async () => {
      render(<TestLayout />)

      const header = await screen.findByRole('banner')
      const themeToggle = await screen.findByRole('button', { name: /toggle theme/i })

      expect(header).toContainElement(themeToggle)
    })
  })
})
