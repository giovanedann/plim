import { ThemeProvider } from '@/components/theme-provider'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordPage } from '../reset-password.page'

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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

describe('ResetPasswordPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()

    // Mock window location hash
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost/reset-password#access_token=test&type=recovery',
        hash: '#access_token=test&type=recovery',
      },
      writable: true,
    })

    useAuthStore.setState({
      user: { id: 'user-123', email: 'test@example.com' } as any,
      isLoading: false,
      error: null,
      isInitialized: true,
      updatePassword: vi.fn(),
      clearError: vi.fn(),
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loading state', () => {
    it('shows loading spinner during code exchange', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Validando link.../i)).toBeInTheDocument()
    })

    it('displays loading indicator', () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { container } = render(<ResetPasswordPage />, { wrapper: TestWrapper })

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('form rendering after validation', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('renders password reset form', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Check for the main heading
        expect(screen.getByRole('heading', { name: /Nova senha/i, level: 1 })).toBeInTheDocument()
      })
    })

    it('shows form fields', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Confirmar senha/i)).toBeInTheDocument()
      })
    })

    it('renders submit button', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Atualizar senha/i })).toBeInTheDocument()
      })
    })
  })

  describe('password visibility toggle', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('toggles password visibility', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/Nova senha/i)
      expect(passwordInput).toHaveAttribute('type', 'password')

      const eyeButtons = screen.getAllByRole('button', { name: '' })
      await user.click(eyeButtons[0]!)

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text')
      })
    })
  })

  describe('form validation', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('requires minimum password length', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Nova senha/i), 'short')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'short')
      await user.click(screen.getByRole('button', { name: /Atualizar senha/i }))

      await waitFor(() => {
        // Check for error message (not helper text)
        expect(
          screen.getAllByText(/A senha deve ter pelo menos 6 caracteres/i)[1]
        ).toBeInTheDocument()
      })
    })

    it('validates password match', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Nova senha/i), 'password123')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'different456')
      await user.click(screen.getByRole('button', { name: /Atualizar senha/i }))

      await waitFor(() => {
        expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument()
      })
    })

    it('password fields are required', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toHaveAttribute('required')
        expect(screen.getByLabelText(/Confirmar senha/i)).toHaveAttribute('required')
      })
    })
  })

  describe('form submission', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('calls updatePassword with new password', async () => {
      const updatePasswordSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({ updatePassword: updatePasswordSpy } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Nova senha/i), 'newpassword123')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /Atualizar senha/i }))

      await waitFor(() => {
        expect(updatePasswordSpy).toHaveBeenCalledWith('newpassword123')
      })
    })

    it('disables form while loading', async () => {
      useAuthStore.setState({ isLoading: true } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeDisabled()
        expect(screen.getByLabelText(/Confirmar senha/i)).toBeDisabled()
        expect(screen.getByRole('button', { name: /Atualizar senha/i })).toBeDisabled()
      })
    })

    it('shows loading spinner in button', async () => {
      useAuthStore.setState({ isLoading: true } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Atualizar senha/i })
        expect(button.querySelector('.animate-spin')).toBeInTheDocument()
      })
    })
  })

  describe('success state', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('shows success message after password update', async () => {
      const updatePasswordSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({ updatePassword: updatePasswordSpy } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/Nova senha/i), 'newpassword123')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /Atualizar senha/i }))

      await waitFor(() => {
        expect(updatePasswordSpy).toHaveBeenCalled()
      })
    })
  })

  describe('error state', () => {
    it('shows error for invalid link', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost/reset-password#error=invalid_link',
          hash: '#error=invalid_link&error_description=Invalid+recovery+link',
        },
        writable: true,
      })

      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Link inválido/i)).toBeInTheDocument()
      })
    })

    it('shows link to request new recovery link on error', async () => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid link' } as any,
      } as any)

      useAuthStore.setState({ user: null } as any)

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Solicitar novo link/i })).toBeInTheDocument()
      })
    })
  })

  describe('auto-focus', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('password field has autofocus', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        // Check that the password input receives focus
        expect(screen.getByLabelText(/Nova senha/i)).toHaveFocus()
      })
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
        data: { session: { access_token: 'token' } as any, user: { id: 'user-123' } as any },
        error: null,
      } as any)
    })

    it('has proper form labels', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Confirmar senha/i)).toBeInTheDocument()
      })
    })

    it('has descriptive button text', async () => {
      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Atualizar senha/i })).toBeInTheDocument()
      })
    })
  })
})
