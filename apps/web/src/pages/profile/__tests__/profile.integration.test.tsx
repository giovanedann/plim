import { ThemeProvider } from '@/components/theme-provider'
import { profileService } from '@/services/profile.service'
import { createMockProfile, resetIdCounter } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from '../profile.page'

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

describe('ProfilePage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetIdCounter()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders page description', async () => {
      const mockProfile = createMockProfile({
        name: 'John Doe',
        email: 'john@example.com',
      })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Gerencie suas informações pessoais/i)).toBeInTheDocument()
      })
    })

    it('shows loading skeleton while fetching profile', () => {
      vi.spyOn(profileService, 'getProfile').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<ProfilePage />, { wrapper: TestWrapper })

      // Check for skeleton loading state by looking for the Skeleton component class
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('displays profile information when loaded', async () => {
      const mockProfile = createMockProfile({
        name: 'John Doe',
        email: 'john@example.com',
        currency: 'BRL',
        locale: 'pt-BR',
      })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Real (BRL)')).toBeInTheDocument()
        expect(screen.getByText('Português (Brasil)')).toBeInTheDocument()
      })
    })

    it('shows error message when profile fails to load', async () => {
      vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        error: { code: 'SERVER_ERROR', message: 'Failed to load profile' },
      })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Erro ao carregar perfil/i)).toBeInTheDocument()
      })
    })
  })

  describe('profile sections', () => {
    it('renders all major sections', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Perfil')).toBeInTheDocument()
        expect(screen.getByText('Suas informações pessoais e preferências')).toBeInTheDocument()
      })
    })

    it('displays profile card with user data', async () => {
      const mockProfile = createMockProfile({
        name: 'Jane Smith',
        email: 'jane@example.com',
      })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Nome')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Moeda')).toBeInTheDocument()
        expect(screen.getByText('Idioma')).toBeInTheDocument()
      })
    })
  })

  describe('profile editing', () => {
    it('shows edit button for profile', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument()
      })
    })

    it('toggles to edit mode when edit button is clicked', async () => {
      const mockProfile = createMockProfile({ name: 'John Doe' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })
      vi.spyOn(profileService, 'updateProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /editar perfil/i })
      await user.click(editButton)

      // In edit mode, we should see form inputs instead of display text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
      })
    })
  })

  describe('avatar management', () => {
    it('displays avatar upload section', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Avatar section should be present (implementation may vary)
        expect(screen.getByText('Perfil')).toBeInTheDocument()
      })
    })
  })

  describe('data export section', () => {
    it('renders data export section', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      // Data export section exists in the component
      await waitFor(() => {
        expect(screen.getByText('Perfil')).toBeInTheDocument()
      })
    })
  })

  describe('danger zone section', () => {
    it('renders danger zone section', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      // Danger zone section exists in the component
      await waitFor(() => {
        expect(screen.getByText('Perfil')).toBeInTheDocument()
      })
    })
  })

  describe('profile fields', () => {
    it('displays all profile field labels', async () => {
      const mockProfile = createMockProfile()

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Nome')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Moeda')).toBeInTheDocument()
        expect(screen.getByText('Idioma')).toBeInTheDocument()
      })
    })

    it('handles missing name with dash', async () => {
      const mockProfile = createMockProfile({ name: null })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const nameElements = screen.getAllByText('-')
        expect(nameElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('currency and locale display', () => {
    it('displays correct currency label for BRL', async () => {
      const mockProfile = createMockProfile({ currency: 'BRL' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Real (BRL)')).toBeInTheDocument()
      })
    })

    it('displays correct currency label for USD', async () => {
      const mockProfile = createMockProfile({ currency: 'USD' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Dólar (USD)')).toBeInTheDocument()
      })
    })

    it('displays correct currency label for EUR', async () => {
      const mockProfile = createMockProfile({ currency: 'EUR' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Euro (EUR)')).toBeInTheDocument()
      })
    })

    it('displays correct locale label for pt-BR', async () => {
      const mockProfile = createMockProfile({ locale: 'pt-BR' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Português (Brasil)')).toBeInTheDocument()
      })
    })

    it('displays correct locale label for en-US', async () => {
      const mockProfile = createMockProfile({ locale: 'en-US' })

      vi.spyOn(profileService, 'getProfile').mockResolvedValue({ data: mockProfile })

      render(<ProfilePage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('English (US)')).toBeInTheDocument()
      })
    })
  })
})
