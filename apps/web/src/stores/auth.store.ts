import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  setSession: (session: Session | null) => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
    })
  },

  clearError: () => set({ error: null }),

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
      set({ error: err instanceof Error ? err.message : 'Erro ao entrar com Google' })
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
      set({ error: err instanceof Error ? err.message : 'Erro ao entrar' })
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
      set({ error: err instanceof Error ? err.message : 'Erro ao criar conta' })
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
