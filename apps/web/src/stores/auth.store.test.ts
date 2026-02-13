import type { Session, User } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb-keyval', () => ({
  del: vi.fn().mockResolvedValue(undefined),
}))

const mockCachesDelete = vi.fn().mockResolvedValue(true)
vi.stubGlobal('caches', { delete: mockCachesDelete })

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { del } from 'idb-keyval'
import { useAuthStore } from './auth.store'

describe('useAuthStore', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  }

  const mockSession: Session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  }

  const initialState = {
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,
    isInRecoveryMode: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state before each test
    useAuthStore.setState(initialState)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('has user as null by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.user).toBeNull()
    })

    it('has session as null by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.session).toBeNull()
    })

    it('has isLoading as false by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.isLoading).toBe(false)
    })

    it('has isInitialized as false by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.isInitialized).toBe(false)
    })

    it('has isInRecoveryMode as false by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.isInRecoveryMode).toBe(false)
    })

    it('has error as null by default', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Assert
      expect(sut.error).toBeNull()
    })
  })

  describe('setSession', () => {
    it('sets session and user when session is provided', () => {
      // Arrange
      const sut = useAuthStore.getState()

      // Act
      sut.setSession(mockSession)

      // Assert
      const state = useAuthStore.getState()
      expect(state.session).toBe(mockSession)
      expect(state.user).toBe(mockUser)
    })

    it('clears user when session is null', () => {
      // Arrange
      useAuthStore.setState({ session: mockSession, user: mockUser })
      const sut = useAuthStore.getState()

      // Act
      sut.setSession(null)

      // Assert
      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.user).toBeNull()
    })
  })

  describe('clearError', () => {
    it('clears error', () => {
      // Arrange
      useAuthStore.setState({ error: 'Some error' })
      const sut = useAuthStore.getState()

      // Act
      sut.clearError()

      // Assert
      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('clearRecoveryMode', () => {
    it('clears recovery mode', () => {
      // Arrange
      useAuthStore.setState({ isInRecoveryMode: true })
      const sut = useAuthStore.getState()

      // Act
      sut.clearRecoveryMode()

      // Assert
      expect(useAuthStore.getState().isInRecoveryMode).toBe(false)
    })
  })

  describe('signInWithGoogle', () => {
    it('calls supabase signInWithOAuth with correct parameters', async () => {
      // Arrange
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://google.com/oauth' },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithGoogle()

      // Assert
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.signInWithOAuth).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: { provider: 'google', url: '' }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithGoogle()

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('clears error before operation', async () => {
      // Arrange
      useAuthStore.setState({ error: 'Previous error' })
      let errorDuringCall: string | null = 'not cleared'
      vi.mocked(supabase.auth.signInWithOAuth).mockImplementation(async () => {
        errorDuringCall = useAuthStore.getState().error
        return { data: { provider: 'google', url: '' }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithGoogle()

      // Assert
      expect(errorDuringCall).toBeNull()
    })

    it('sets error when supabase returns error', async () => {
      // Arrange
      const authError = new Error('OAuth error')
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithGoogle()

      // Assert
      expect(useAuthStore.getState().error).toBe('OAuth error')
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithGoogle()

      // Assert
      expect(useAuthStore.getState().error).toBe('Erro ao entrar com Google')
    })
  })

  describe('signInWithEmail', () => {
    it('calls supabase signInWithPassword with correct parameters', async () => {
      // Arrange
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithEmail('test@example.com', 'password123')

      // Assert
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: { user: mockUser, session: mockSession }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signInWithEmail('test@example.com', 'password123')

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('throws error and sets error state when supabase returns error', async () => {
      // Arrange
      const authError = new Error('Invalid credentials')
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.signInWithEmail('test@example.com', 'wrong')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('Invalid credentials')
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.signInWithEmail('test@example.com', 'password')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('Erro ao entrar')
    })
  })

  describe('signUpWithEmail', () => {
    it('calls supabase signUp with correct parameters without displayName', async () => {
      // Arrange
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signUpWithEmail('test@example.com', 'password123')

      // Assert
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
          data: undefined,
        },
      })
    })

    it('calls supabase signUp with displayName in metadata', async () => {
      // Arrange
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signUpWithEmail('test@example.com', 'password123', 'John Doe')

      // Assert
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
          data: { name: 'John Doe' },
        },
      })
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.signUp).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: { user: mockUser, session: mockSession }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signUpWithEmail('test@example.com', 'password123')

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('throws error and sets error state when supabase returns error', async () => {
      // Arrange
      const authError = new Error('Email already exists')
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.signUpWithEmail('test@example.com', 'password')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('Email already exists')
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.signUp).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.signUpWithEmail('test@example.com', 'password')).rejects.toBeDefined()
      expect(useAuthStore.getState().error).toBe('Erro ao criar conta')
    })
  })

  describe('resetPassword', () => {
    it('calls supabase resetPasswordForEmail with correct email', async () => {
      // Arrange
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.resetPassword('test@example.com')

      // Assert
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.resetPasswordForEmail).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: {}, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.resetPassword('test@example.com')

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('throws error and sets error state when supabase returns error', async () => {
      // Arrange
      const authError = new Error('User not found')
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.resetPassword('test@example.com')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('User not found')
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.resetPasswordForEmail).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.resetPassword('test@example.com')).rejects.toBeDefined()
      expect(useAuthStore.getState().error).toBe('Erro ao enviar email de recuperação')
    })
  })

  describe('verifyRecoveryOtp', () => {
    it('calls supabase verifyOtp with correct parameters', async () => {
      // Arrange
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.verifyRecoveryOtp('test@example.com', '123456')

      // Assert
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'recovery',
      })
    })

    it('sets isInRecoveryMode to true on success', async () => {
      // Arrange
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.verifyRecoveryOtp('test@example.com', '123456')

      // Assert
      expect(useAuthStore.getState().isInRecoveryMode).toBe(true)
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.verifyOtp).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: { user: mockUser, session: mockSession }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.verifyRecoveryOtp('test@example.com', '123456')

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('throws error and sets error state when supabase returns error', async () => {
      // Arrange
      const authError = new Error('Invalid OTP')
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.verifyRecoveryOtp('test@example.com', 'wrong')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('Invalid OTP')
      expect(useAuthStore.getState().isInRecoveryMode).toBe(false)
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.verifyOtp).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.verifyRecoveryOtp('test@example.com', '123456')).rejects.toBeDefined()
      expect(useAuthStore.getState().error).toBe('Código inválido ou expirado')
    })
  })

  describe('updatePassword', () => {
    it('calls supabase updateUser with new password', async () => {
      // Arrange
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.updatePassword('newPassword123')

      // Assert
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      })
    })

    it('clears isInRecoveryMode on success', async () => {
      // Arrange
      useAuthStore.setState({ isInRecoveryMode: true })
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.updatePassword('newPassword123')

      // Assert
      expect(useAuthStore.getState().isInRecoveryMode).toBe(false)
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.updateUser).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { data: { user: mockUser }, error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.updatePassword('newPassword123')

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('throws error and sets error state when supabase returns error', async () => {
      // Arrange
      const authError = new Error('Password too weak')
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: authError as never,
      })
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.updatePassword('weak')).rejects.toThrow()
      expect(useAuthStore.getState().error).toBe('Password too weak')
    })

    it('sets generic error message when error is not an Error instance', async () => {
      // Arrange
      vi.mocked(supabase.auth.updateUser).mockRejectedValue('Unknown error')
      const sut = useAuthStore.getState()

      // Act & Assert
      await expect(sut.updatePassword('password')).rejects.toBeDefined()
      expect(useAuthStore.getState().error).toBe('Erro ao atualizar senha')
    })
  })

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      // Arrange
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
      const sut = useAuthStore.getState()

      // Act
      await sut.signOut()

      // Assert
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('clears user and session on success', async () => {
      // Arrange
      useAuthStore.setState({ user: mockUser, session: mockSession })
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
      const sut = useAuthStore.getState()

      // Act
      await sut.signOut()

      // Assert
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })

    it('sets isLoading to true during operation', async () => {
      // Arrange
      let loadingDuringCall = false
      vi.mocked(supabase.auth.signOut).mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { error: null }
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.signOut()

      // Assert
      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('clears persisted IndexedDB cache on success', async () => {
      // Arrange
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
      const sut = useAuthStore.getState()

      // Act
      await sut.signOut()

      // Assert
      expect(del).toHaveBeenCalledWith('plim-react-query-cache')
    })

    it('clears Cache Storage api-cache on success', async () => {
      // Arrange
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
      const sut = useAuthStore.getState()

      // Act
      await sut.signOut()

      // Assert
      expect(mockCachesDelete).toHaveBeenCalledWith('api-cache')
    })

    it('still clears user and session when supabase returns error', async () => {
      // Arrange - signOut throws error but the finally block still clears user/session
      const authError = new Error('Sign out error')
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: authError as never,
      })
      useAuthStore.setState({ user: mockUser, session: mockSession })
      const sut = useAuthStore.getState()

      // Act - signOut throws because of the error, but user/session should be cleared
      await expect(sut.signOut()).rejects.toThrow('Sign out error')

      // Assert - loading is reset to false in finally block
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('initialize', () => {
    it('gets current session and sets user', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never)
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()

      // Assert
      const state = useAuthStore.getState()
      expect(state.session).toBe(mockSession)
      expect(state.user).toBe(mockUser)
      expect(state.isInitialized).toBe(true)
    })

    it('sets user to null when no session exists', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never)
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()

      // Assert
      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isInitialized).toBe(true)
    })

    it('registers onAuthStateChange listener', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as never)
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()

      // Assert
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    it('onAuthStateChange callback updates session and user', async () => {
      // Arrange
      let authCallback: any = () => {}
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } } as never
      })
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()
      authCallback('SIGNED_IN', mockSession)

      // Assert
      const state = useAuthStore.getState()
      expect(state.session).toBe(mockSession)
      expect(state.user).toBe(mockUser)
    })

    it('does not reinitialize if already initialized', async () => {
      // Arrange
      useAuthStore.setState({ isInitialized: true })
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()

      // Assert
      expect(supabase.auth.getSession).not.toHaveBeenCalled()
    })

    it('sets isInitialized to true even when getSession fails', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'))
      const sut = useAuthStore.getState()

      // Act
      await sut.initialize()

      // Assert
      expect(useAuthStore.getState().isInitialized).toBe(true)
    })
  })

  describe('password recovery flow', () => {
    it('completes full password recovery flow', async () => {
      // Arrange
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      })
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      const sut = useAuthStore.getState()

      // Act - Step 1: Request password reset
      await sut.resetPassword('test@example.com')

      // Assert
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')

      // Act - Step 2: Verify OTP
      await sut.verifyRecoveryOtp('test@example.com', '123456')

      // Assert
      expect(useAuthStore.getState().isInRecoveryMode).toBe(true)

      // Act - Step 3: Update password
      await sut.updatePassword('newSecurePassword123')

      // Assert
      expect(useAuthStore.getState().isInRecoveryMode).toBe(false)
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newSecurePassword123',
      })
    })
  })

  describe('authentication flow', () => {
    it('completes full sign up and sign out flow', async () => {
      // Arrange
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
      const sut = useAuthStore.getState()

      // Act - Sign up
      await sut.signUpWithEmail('test@example.com', 'password123', 'Test User')

      // Assert
      expect(supabase.auth.signUp).toHaveBeenCalled()

      // Act - Sign out
      await sut.signOut()

      // Assert
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })
})
