import { useInstallPromptStore } from '@/stores/install-prompt.store'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSidebar } from './app-sidebar'

// Mock values
const mockSignOut = vi.fn()
const mockPromptInstall = vi.fn()
const mockUseLocation = vi.fn(() => ({ pathname: '/dashboard' }))
const mockProfile = {
  id: 'profile-123',
  user_id: 'user-123',
  name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  is_onboarded: true,
  referred_by: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
}
const mockUser = {
  id: 'user-123',
  email: 'john@example.com',
  user_metadata: {
    avatar_url: 'https://example.com/default-avatar.jpg',
  },
}

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} data-active={props['data-active']} {...props}>
        {children}
      </a>
    ),
    useLocation: () => mockUseLocation(),
  }
})

// Mock hooks
vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    isLoading: false,
  }),
}))

vi.mock('@/hooks/use-subscription', () => ({
  useSubscription: () => ({
    subscription: null,
    isPro: false,
    isExpiringSoon: false,
    daysRemaining: null,
    isLoading: false,
  }),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: mockUser,
    signOut: mockSignOut,
    isInitialized: true,
  }),
}))

const mockInstallPromptHook = {
  canPrompt: false,
  isInstalled: false,
  isIOS: false,
  promptInstall: mockPromptInstall,
}

vi.mock('@/hooks/use-install-prompt', () => ({
  useInstallPrompt: () => mockInstallPromptHook,
}))

// Mock shadcn components
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => (
    <aside data-testid="sidebar" {...props}>
      {children}
    </aside>
  ),
  SidebarHeader: ({ children, ...props }: any) => <header {...props}>{children}</header>,
  SidebarContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarFooter: ({ children, ...props }: any) => <footer {...props}>{children}</footer>,
  SidebarRail: (props: any) => <div data-testid="sidebar-rail" {...props} />,
  SidebarGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarGroupContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarGroupLabel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SidebarMenu: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  SidebarMenuButton: ({ children, asChild, isActive, ...props }: any) =>
    asChild ? (
      <div data-active={isActive}>{children}</div>
    ) : (
      <button data-active={isActive} {...props}>
        {children}
      </button>
    ),
  SidebarMenuItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuGroup: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild, ...props }: any) =>
    asChild ? (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ) : (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  DropdownMenuLabel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuSeparator: (props: any) => <hr {...props} />,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) =>
    asChild ? (
      children
    ) : (
      <button type="button" {...props}>
        {children}
      </button>
    ),
}))

// Note: Avatar component mock not needed - component uses plain img tag

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' })
    mockInstallPromptHook.canPrompt = false
    mockInstallPromptHook.isInstalled = false
    mockInstallPromptHook.isIOS = false
    mockInstallPromptHook.promptInstall = mockPromptInstall
    useInstallPromptStore.setState({ dismissed: false, showIOSOverlay: false })
  })

  describe('navigation rendering', () => {
    it('renders all navigation items', () => {
      render(<AppSidebar />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Transações')).toBeInTheDocument()
      expect(screen.getByText('Categorias')).toBeInTheDocument()
      expect(screen.getByText('Cartões')).toBeInTheDocument()
    })

    it('renders navigation links with correct URLs', () => {
      render(<AppSidebar />)

      const dashboardLink = screen.getByText('Dashboard').closest('a')
      const expensesLink = screen.getByText('Transações').closest('a')
      const categoriesLink = screen.getByText('Categorias').closest('a')
      const cardsLink = screen.getByText('Cartões').closest('a')

      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
      expect(expensesLink).toHaveAttribute('href', '/expenses')
      expect(categoriesLink).toHaveAttribute('href', '/categories')
      expect(cardsLink).toHaveAttribute('href', '/credit-cards')
    })

    it('renders application title', () => {
      render(<AppSidebar />)

      expect(screen.getByText('Plim')).toBeInTheDocument()
    })

    it('renders application subtitle', () => {
      render(<AppSidebar />)

      expect(screen.getByText('Finanças pessoais')).toBeInTheDocument()
    })
  })

  describe('active route highlighting', () => {
    it('highlights dashboard as active when on dashboard route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      render(<AppSidebar />)

      const dashboardWrapper = screen.getByText('Dashboard').closest('[data-active]')
      expect(dashboardWrapper).toHaveAttribute('data-active', 'true')
    })

    it('highlights expenses as active when on expenses route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/expenses' })

      render(<AppSidebar />)

      const expensesWrapper = screen.getByText('Transações').closest('[data-active]')
      expect(expensesWrapper).toHaveAttribute('data-active', 'true')
    })

    it('highlights categories as active when on categories route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/categories' })

      render(<AppSidebar />)

      const categoriesWrapper = screen.getByText('Categorias').closest('[data-active]')
      expect(categoriesWrapper).toHaveAttribute('data-active', 'true')
    })

    it('highlights credit cards as active when on credit cards route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/credit-cards' })

      render(<AppSidebar />)

      const cardsWrapper = screen.getByText('Cartões').closest('[data-active]')
      expect(cardsWrapper).toHaveAttribute('data-active', 'true')
    })

    it('does not highlight inactive routes', () => {
      mockUseLocation.mockReturnValue({ pathname: '/dashboard' })

      render(<AppSidebar />)

      const expensesWrapper = screen.getByText('Transações').closest('[data-active]')
      const categoriesWrapper = screen.getByText('Categorias').closest('[data-active]')
      const cardsWrapper = screen.getByText('Cartões').closest('[data-active]')

      expect(expensesWrapper).toHaveAttribute('data-active', 'false')
      expect(categoriesWrapper).toHaveAttribute('data-active', 'false')
      expect(cardsWrapper).toHaveAttribute('data-active', 'false')
    })
  })

  describe('user dropdown', () => {
    it('displays user name from profile', () => {
      render(<AppSidebar />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('displays user email', () => {
      render(<AppSidebar />)

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('displays profile avatar when available', () => {
      render(<AppSidebar />)

      const avatar = screen.getByAltText('Avatar')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      expect(avatar).toBeInTheDocument()
    })

    it('renders profile menu item', () => {
      render(<AppSidebar />)

      expect(screen.getByText('Perfil')).toBeInTheDocument()
    })

    it('renders logout menu item', () => {
      render(<AppSidebar />)

      expect(screen.getByText('Sair')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('calls signOut when logout button is clicked', async () => {
      const user = userEvent.setup()

      render(<AppSidebar />)

      const logoutButton = screen.getByText('Sair')
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('profile link points to profile page', () => {
      render(<AppSidebar />)

      const profileLink =
        screen.getByText('Perfil').querySelector('a') || screen.getByText('Perfil').closest('a')
      expect(profileLink).toHaveAttribute('href', '/profile')
    })
  })

  describe('accessibility', () => {
    it('renders navigation as accessible nav element', () => {
      render(<AppSidebar />)

      const navs = screen.getAllByRole('navigation')
      expect(navs.length).toBeGreaterThan(0)
      expect(navs[0]).toBeInTheDocument()
    })

    it('sidebar is rendered as aside landmark', () => {
      render(<AppSidebar />)

      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar.tagName.toLowerCase()).toBe('aside')
    })

    it('logout button is keyboard accessible', async () => {
      const user = userEvent.setup()

      render(<AppSidebar />)

      const logoutButton = screen.getByText('Sair')

      // Should be a button element
      expect(logoutButton.tagName.toLowerCase()).toBe('button')

      // Should be clickable via keyboard
      logoutButton.focus()
      await user.keyboard('{Enter}')

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('layout and structure', () => {
    it('renders header section with app title', () => {
      render(<AppSidebar />)

      // Header should contain both logo and title
      const header = screen.getByText('Plim').closest('header')
      expect(header).toBeInTheDocument()
    })

    it('renders footer section with user dropdown', () => {
      render(<AppSidebar />)

      // Footer should contain user info
      const footer = screen.getByText('John Doe').closest('footer')
      expect(footer).toBeInTheDocument()
    })

    it('renders content section with navigation', () => {
      render(<AppSidebar />)

      const navs = screen.getAllByRole('navigation')
      const mainNav = navs.find((nav) => nav.textContent?.includes('Dashboard'))
      expect(mainNav).toBeInTheDocument()
      expect(mainNav?.textContent).toContain('Dashboard')
      expect(mainNav?.textContent).toContain('Transações')
    })
  })

  describe('install app action', () => {
    it('shows install option when canPrompt is true', () => {
      mockInstallPromptHook.canPrompt = true

      render(<AppSidebar />)

      expect(screen.getByText('Instalar app')).toBeInTheDocument()
    })

    it('shows install option when isIOS is true', () => {
      mockInstallPromptHook.isIOS = true

      render(<AppSidebar />)

      expect(screen.getByText('Instalar app')).toBeInTheDocument()
    })

    it('hides install option when already installed', () => {
      mockInstallPromptHook.isInstalled = true
      mockInstallPromptHook.canPrompt = true

      render(<AppSidebar />)

      expect(screen.queryByText('Instalar app')).not.toBeInTheDocument()
    })

    it('calls promptInstall on non-iOS devices', async () => {
      mockInstallPromptHook.canPrompt = true
      mockInstallPromptHook.isIOS = false
      const user = userEvent.setup()

      render(<AppSidebar />)

      await user.click(screen.getByText('Instalar app'))

      expect(mockPromptInstall).toHaveBeenCalledTimes(1)
    })

    it('opens iOS overlay via store on iOS devices', async () => {
      mockInstallPromptHook.isIOS = true
      const user = userEvent.setup()

      render(<AppSidebar />)

      await user.click(screen.getByText('Instalar app'))

      expect(useInstallPromptStore.getState().showIOSOverlay).toBe(true)
      expect(mockPromptInstall).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('renders sidebar even with minimal data', () => {
      render(<AppSidebar />)

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByText('Plim')).toBeInTheDocument()
      expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    })

    it('renders all navigation items regardless of current route', () => {
      mockUseLocation.mockReturnValue({ pathname: '/unknown-route' })

      render(<AppSidebar />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Transações')).toBeInTheDocument()
      expect(screen.getByText('Categorias')).toBeInTheDocument()
      expect(screen.getByText('Cartões')).toBeInTheDocument()
    })
  })
})
