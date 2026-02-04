import type { AIUsageResponse, ChatMessage } from '@plim/shared'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoredChatMessage extends ChatMessage {
  id: string
}

interface AIState {
  isDrawerOpen: boolean
  isRecording: boolean
  isPulsing: boolean
  messages: StoredChatMessage[]
  usage: AIUsageResponse | null

  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void

  setRecording: (recording: boolean) => void
  setPulsing: (pulsing: boolean) => void

  addMessage: (message: ChatMessage) => void
  clearMessages: () => void

  setUsage: (usage: AIUsageResponse) => void
}

let messageIdCounter = 0

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      isDrawerOpen: false,
      isRecording: false,
      isPulsing: false,
      messages: [],
      usage: null,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      setRecording: (recording) => set({ isRecording: recording }),
      setPulsing: (pulsing) => set({ isPulsing: pulsing }),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: `msg-${Date.now()}-${++messageIdCounter}` },
          ],
        })),
      clearMessages: () => set({ messages: [] }),

      setUsage: (usage) => set({ usage }),
    }),
    {
      name: 'plim-ai-store',
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
)
