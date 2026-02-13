import { create } from 'zustand'

interface InstallPromptState {
  dismissed: boolean
  showIOSOverlay: boolean
  dismiss: () => void
  openIOSOverlay: () => void
  closeIOSOverlay: () => void
}

export const useInstallPromptStore = create<InstallPromptState>((set) => ({
  dismissed: false,
  showIOSOverlay: false,
  dismiss: () => set({ dismissed: true, showIOSOverlay: false }),
  openIOSOverlay: () => set({ showIOSOverlay: true }),
  closeIOSOverlay: () => set({ showIOSOverlay: false }),
}))
