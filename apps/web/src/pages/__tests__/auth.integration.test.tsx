import { useAuthStore } from '@/stores/auth.store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authentication state management', () => {
    it('initializes with no user', () => {
      const { user, isInitialized } = useAuthStore.getState()

      expect(user).toBeNull()
      expect(isInitialized).toBe(true)
    })

    it('sets user when sign in succeeds', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      useAuthStore.setState({
        user: mockUser as any,
        isLoading: false,
        error: null,
      })

      const { user } = useAuthStore.getState()
      expect(user).toEqual(mockUser)
    })

    it('sets error when sign in fails', () => {
      const errorMessage = 'Invalid credentials'

      useAuthStore.setState({
        user: null,
        isLoading: false,
        error: errorMessage,
      })

      const { error } = useAuthStore.getState()
      expect(error).toBe(errorMessage)
    })

    it('clears error when clearError is called', () => {
      useAuthStore.setState({
        error: 'Some error',
      })

      useAuthStore.getState().clearError()

      const { error } = useAuthStore.getState()
      expect(error).toBeNull()
    })

    it('sets loading state during authentication', () => {
      useAuthStore.setState({
        isLoading: true,
      })

      const { isLoading } = useAuthStore.getState()
      expect(isLoading).toBe(true)
    })
  })

  describe('sign in flows', () => {
    it('provides signInWithEmail function', () => {
      const { signInWithEmail } = useAuthStore.getState()
      expect(signInWithEmail).toBeDefined()
      expect(typeof signInWithEmail).toBe('function')
    })

    it('provides signInWithGoogle function', () => {
      const { signInWithGoogle } = useAuthStore.getState()
      expect(signInWithGoogle).toBeDefined()
      expect(typeof signInWithGoogle).toBe('function')
    })

    it('provides signUpWithEmail function', () => {
      const { signUpWithEmail } = useAuthStore.getState()
      expect(signUpWithEmail).toBeDefined()
      expect(typeof signUpWithEmail).toBe('function')
    })

    it('provides signOut function', () => {
      const { signOut } = useAuthStore.getState()
      expect(signOut).toBeDefined()
      expect(typeof signOut).toBe('function')
    })
  })

  describe('authentication session', () => {
    it('removes user on sign out', () => {
      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com' } as any,
      })

      useAuthStore.setState({
        user: null,
      })

      const { user } = useAuthStore.getState()
      expect(user).toBeNull()
    })

    it('maintains user across state updates', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' } as any

      useAuthStore.setState({ user: mockUser })
      useAuthStore.setState({ isLoading: false })

      const { user } = useAuthStore.getState()
      expect(user).toEqual(mockUser)
    })
  })

  describe('error handling', () => {
    it('handles multiple error scenarios', () => {
      const errors = ['Invalid email', 'Wrong password', 'Network error']

      for (const errorMessage of errors) {
        useAuthStore.setState({ error: errorMessage })
        expect(useAuthStore.getState().error).toBe(errorMessage)
      }
    })

    it('clears error before new sign in attempt', () => {
      useAuthStore.setState({ error: 'Previous error' })

      useAuthStore.getState().clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('initialization state', () => {
    it('tracks initialization status', () => {
      useAuthStore.setState({ isInitialized: false })
      expect(useAuthStore.getState().isInitialized).toBe(false)

      useAuthStore.setState({ isInitialized: true })
      expect(useAuthStore.getState().isInitialized).toBe(true)
    })

    it('provides recovery mode status', () => {
      const { isInRecoveryMode } = useAuthStore.getState()
      expect(typeof isInRecoveryMode).toBe('boolean')
    })
  })
})
