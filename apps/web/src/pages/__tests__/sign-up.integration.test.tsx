import { ThemeProvider } from '@/components/theme-provider'
import { useAuthStore } from '@/stores/auth.store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignUpPage } from '../sign-up.page'

const mockSearchParams = { ref: undefined as string | undefined }

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useSearch: () => mockSearchParams,
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

describe('SignUpPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    mockSearchParams.ref = undefined
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('basic rendering', () => {
    it('renders sign up heading and description', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('heading', { name: 'Criar conta', level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/Comece a gerenciar suas finanças hoje/i)).toBeInTheDocument()
    })

    it('renders card with title and description', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText('Registrar')).toBeInTheDocument()
      expect(screen.getByText(/Crie sua conta com email e senha/i)).toBeInTheDocument()
    })

    it('shows link to sign in page', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Já tem uma conta/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Entrar/i })).toBeInTheDocument()
    })
  })

  describe('form fields', () => {
    it('renders all form inputs', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirmar senha/i)).toBeInTheDocument()
    })

    it('has correct input types', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByLabelText(/Nome/i)).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText(/Email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/^Senha$/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/Confirmar senha/i)).toHaveAttribute('type', 'password')
    })

    it('name field is optional', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const nameInput = screen.getByLabelText(/Nome/i)
      expect(nameInput).not.toHaveAttribute('required')
    })

    it('email field is required', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const emailInput = screen.getByLabelText(/Email/i)
      expect(emailInput).toHaveAttribute('required')
    })

    it('password fields are required', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByLabelText(/^Senha$/i)).toHaveAttribute('required')
      expect(screen.getByLabelText(/Confirmar senha/i)).toHaveAttribute('required')
    })
  })

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      expect(passwordInput).toHaveAttribute('type', 'password')

      // There are multiple password toggle buttons, get the first one for password field
      const eyeButtons = screen.getAllByRole('button', { name: '' })
      await user.click(eyeButtons[0]!)

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text')
      })
    })

    it('toggles confirm password visibility', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const confirmPasswordInput = screen.getByLabelText(/Confirmar senha/i)
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // Second password toggle button is for confirm password
      const eyeButtons = screen.getAllByRole('button', { name: '' })
      await user.click(eyeButtons[1]!)

      await waitFor(() => {
        expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      })
    })
  })

  describe('password requirements validation', () => {
    it('shows password requirements when typing', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      await user.type(passwordInput, 'a')

      await waitFor(() => {
        expect(screen.getByText(/8\+ caracteres/i)).toBeInTheDocument()
        expect(screen.getByText(/Letra maiúscula/i)).toBeInTheDocument()
        expect(screen.getByText(/Letra minúscula/i)).toBeInTheDocument()
        expect(screen.getByText(/Número/i)).toBeInTheDocument()
        expect(screen.getByText(/Símbolo/i)).toBeInTheDocument()
      })
    })

    it('validates minimum length requirement', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      await user.type(passwordInput, 'Short1!')

      await waitFor(() => {
        expect(screen.getByText(/8\+ caracteres/i)).toBeInTheDocument()
      })
    })

    it('validates uppercase letter requirement', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      await user.type(passwordInput, 'lowercase123!')

      await waitFor(() => {
        expect(screen.getByText(/Letra maiúscula/i)).toBeInTheDocument()
      })
    })

    it('validates all requirements with valid password', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      await user.type(passwordInput, 'ValidPass123!')

      await waitFor(() => {
        expect(screen.getByText(/8\+ caracteres/i)).toBeInTheDocument()
        expect(screen.getByText(/Letra maiúscula/i)).toBeInTheDocument()
        expect(screen.getByText(/Letra minúscula/i)).toBeInTheDocument()
        expect(screen.getByText(/Número/i)).toBeInTheDocument()
        expect(screen.getByText(/Símbolo/i)).toBeInTheDocument()
      })
    })
  })

  describe('password confirmation', () => {
    it('shows password match indicator when typing confirm password', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      const confirmInput = screen.getByLabelText(/Confirmar senha/i)

      await user.type(passwordInput, 'ValidPass123!')
      await user.type(confirmInput, 'ValidPass123!')

      await waitFor(() => {
        expect(screen.getByText(/Senhas coincidem/i)).toBeInTheDocument()
      })
    })

    it('shows mismatch indicator when passwords differ', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const passwordInput = screen.getByLabelText(/^Senha$/i)
      const confirmInput = screen.getByLabelText(/Confirmar senha/i)

      await user.type(passwordInput, 'ValidPass123!')
      await user.type(confirmInput, 'DifferentPass456!')

      await waitFor(() => {
        expect(screen.getByText(/Senhas não coincidem/i)).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('shows create account button', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('button', { name: /Criar conta/i })).toBeInTheDocument()
    })

    it('disables submit button while loading', () => {
      useAuthStore.setState({ isLoading: true })

      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('button', { name: /Criar conta/i })).toBeDisabled()
    })

    it('shows loading spinner when submitting', () => {
      useAuthStore.setState({ isLoading: true })

      render(<SignUpPage />, { wrapper: TestWrapper })

      const submitButton = screen.getByRole('button', { name: /Criar conta/i })
      expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('calls signUpWithEmail when form is submitted with valid data', async () => {
      const signUpSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signUpWithEmail: signUpSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Nome/i), 'John Doe')
      await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'ValidPass123!')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'ValidPass123!')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(signUpSpy).toHaveBeenCalledWith(
          'john@example.com',
          'ValidPass123!',
          'John Doe',
          undefined
        )
      })
    })
  })

  describe('Google sign up', () => {
    it('shows Google sign up button', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeInTheDocument()
    })

    it('shows divider before Google button', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/ou continue com/i)).toBeInTheDocument()
    })

    it('calls signInWithGoogle when Google button is clicked', async () => {
      const googleSignInSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signInWithGoogle: googleSignInSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.click(screen.getByRole('button', { name: /Continuar com Google/i }))

      await waitFor(() => {
        expect(googleSignInSpy).toHaveBeenCalled()
      })
    })

    it('disables Google button while loading', () => {
      useAuthStore.setState({ isLoading: true })

      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('button', { name: /Continuar com Google/i })).toBeDisabled()
    })
  })

  describe('error handling', () => {
    it('displays error from auth store', () => {
      useAuthStore.setState({ error: 'Email already in use' })

      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })

    it('shows validation error for weak password', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'weak')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'weak')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(screen.getByText(/A senha não atende todos os requisitos/i)).toBeInTheDocument()
      })
    })

    it('shows validation error for mismatched passwords', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'ValidPass123!')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'DifferentPass456!')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(screen.getByText(/As senhas não coincidem/i)).toBeInTheDocument()
      })
    })
  })

  describe('success state', () => {
    it('shows success message after successful sign up', async () => {
      const signUpSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signUpWithEmail: signUpSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'ValidPass123!')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'ValidPass123!')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(screen.getByText(/Verifique seu email/i)).toBeInTheDocument()
        expect(
          screen.getByText(/Enviamos um link de confirmação para john@example.com/i)
        ).toBeInTheDocument()
      })
    })

    it('shows link back to login in success state', async () => {
      const signUpSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signUpWithEmail: signUpSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'ValidPass123!')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'ValidPass123!')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Voltar para login/i })).toBeInTheDocument()
      })
    })
  })

  describe('referral code', () => {
    it('pre-fills referral code from search params', () => {
      mockSearchParams.ref = 'giovane-daniel-a7x9'

      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveValue('giovane-daniel-a7x9')
    })

    it('shows referral field as read-only when pre-filled from search params', () => {
      mockSearchParams.ref = 'giovane-daniel-a7x9'

      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveAttribute('readonly')
    })

    it('shows "Preenchido automaticamente" when referral is pre-filled', () => {
      mockSearchParams.ref = 'giovane-daniel-a7x9'

      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Preenchido automaticamente/i)).toBeInTheDocument()
    })

    it('shows "Opcional" when no referral code is present', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Opcional/i)).toBeInTheDocument()
    })

    it('falls back to localStorage referral code when no search param', () => {
      localStorage.setItem('plim_referral_code', 'stored-code-x1y2')

      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveValue('stored-code-x1y2')
    })

    it('shows referral field as read-only when pre-filled from localStorage', () => {
      localStorage.setItem('plim_referral_code', 'stored-code-x1y2')

      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveAttribute('readonly')
    })

    it('prioritizes search param ref over localStorage', () => {
      localStorage.setItem('plim_referral_code', 'stored-code-x1y2')
      mockSearchParams.ref = 'url-code-a7x9'

      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveValue('url-code-a7x9')
    })

    it('allows editing referral field when not pre-filled', async () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).not.toHaveAttribute('readonly')

      await user.type(referralInput, 'manual-code')
      expect(referralInput).toHaveValue('manual-code')
    })

    it('stores referral code in localStorage before Google OAuth', async () => {
      mockSearchParams.ref = 'giovane-daniel-a7x9'
      const googleSignInSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signInWithGoogle: googleSignInSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.click(screen.getByRole('button', { name: /Continuar com Google/i }))

      await waitFor(() => {
        expect(localStorage.getItem('plim_referral_code')).toBe('giovane-daniel-a7x9')
        expect(googleSignInSpy).toHaveBeenCalled()
      })
    })

    it('sends referral code when submitting email sign-up', async () => {
      mockSearchParams.ref = 'giovane-daniel-a7x9'
      const signUpSpy = vi.fn().mockResolvedValue(undefined)
      useAuthStore.setState({
        signUpWithEmail: signUpSpy,
      } as any)

      render(<SignUpPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/Email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^Senha$/i), 'ValidPass123!')
      await user.type(screen.getByLabelText(/Confirmar senha/i), 'ValidPass123!')

      await user.click(screen.getByRole('button', { name: /Criar conta/i }))

      await waitFor(() => {
        expect(signUpSpy).toHaveBeenCalledWith(
          'john@example.com',
          'ValidPass123!',
          undefined,
          'giovane-daniel-a7x9'
        )
      })
    })

    it('renders correct placeholder text', () => {
      render(<SignUpPage />, { wrapper: TestWrapper })

      const referralInput = screen.getByLabelText(/Código de indicação/i)
      expect(referralInput).toHaveAttribute('placeholder', 'ex: giovane-daniel-a7x9')
    })
  })
})
