import { translateAuthError } from '@/lib/auth-errors'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { useAIStore } from './ai.store'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  isInRecoveryMode: boolean
  error: string | null
  setSession: (session: Session | null) => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  verifyRecoveryOtp: (email: string, token: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
  clearRecoveryMode: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  isInRecoveryMode: false,
  error: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
    })
  },

  clearError: () => set({ error: null }),

  clearRecoveryMode: () => set({ isInRecoveryMode: false }),

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      set({
        error: err instanceof Error ? translateAuthError(err.message) : 'Erro ao entrar com Google',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      set({ error: err instanceof Error ? translateAuthError(err.message) : 'Erro ao entrar' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signUpWithEmail: async (email: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: displayName ? { name: displayName } : undefined,
        },
      })
      if (error) throw error
    } catch (err) {
      set({ error: err instanceof Error ? translateAuthError(err.message) : 'Erro ao criar conta' })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? translateAuthError(err.message)
            : 'Erro ao enviar email de recuperação',
      })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  verifyRecoveryOtp: async (email: string, token: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      })
      if (error) throw error
      set({ isInRecoveryMode: true })
    } catch (err) {
      set({
        error:
          err instanceof Error ? translateAuthError(err.message) : 'Código inválido ou expirado',
      })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      set({ isInRecoveryMode: false })
    } catch (err) {
      set({
        error: err instanceof Error ? translateAuthError(err.message) : 'Erro ao atualizar senha',
      })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Clear AI chat history for privacy
      useAIStore.getState().clearMessages()
      set({ user: null, session: null })
    } finally {
      set({ isLoading: false })
    }
  },

  initialize: async () => {
    if (get().isInitialized) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ isInitialized: true })
    }
  },
}))
