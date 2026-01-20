import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  hideValues: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleHideValues: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  hideValues: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
}))
