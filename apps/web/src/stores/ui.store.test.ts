import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './ui.store'

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      sidebarOpen: true,
      hideValues: false,
    })
  })

  describe('initial state', () => {
    it('has sidebar open by default', () => {
      // Arrange
      const sut = useUIStore.getState()

      // Assert
      expect(sut.sidebarOpen).toBe(true)
    })

    it('has hideValues disabled by default', () => {
      // Arrange
      const sut = useUIStore.getState()

      // Assert
      expect(sut.hideValues).toBe(false)
    })
  })

  describe('toggleSidebar', () => {
    it('closes sidebar when open', () => {
      // Arrange
      const sut = useUIStore.getState()
      expect(sut.sidebarOpen).toBe(true)

      // Act
      sut.toggleSidebar()

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('opens sidebar when closed', () => {
      // Arrange
      useUIStore.setState({ sidebarOpen: false })
      const sut = useUIStore.getState()
      expect(sut.sidebarOpen).toBe(false)

      // Act
      sut.toggleSidebar()

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('toggles multiple times correctly', () => {
      // Arrange
      const sut = useUIStore.getState()

      // Act & Assert
      sut.toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(false)

      sut.toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(true)

      sut.toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('setSidebarOpen', () => {
    it('opens sidebar when passing true', () => {
      // Arrange
      useUIStore.setState({ sidebarOpen: false })
      const sut = useUIStore.getState()

      // Act
      sut.setSidebarOpen(true)

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('closes sidebar when passing false', () => {
      // Arrange
      const sut = useUIStore.getState()
      expect(sut.sidebarOpen).toBe(true)

      // Act
      sut.setSidebarOpen(false)

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('keeps sidebar open when already open and passing true', () => {
      // Arrange
      const sut = useUIStore.getState()
      expect(sut.sidebarOpen).toBe(true)

      // Act
      sut.setSidebarOpen(true)

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('keeps sidebar closed when already closed and passing false', () => {
      // Arrange
      useUIStore.setState({ sidebarOpen: false })
      const sut = useUIStore.getState()

      // Act
      sut.setSidebarOpen(false)

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })
  })

  describe('toggleHideValues', () => {
    it('enables hideValues when disabled', () => {
      // Arrange
      const sut = useUIStore.getState()
      expect(sut.hideValues).toBe(false)

      // Act
      sut.toggleHideValues()

      // Assert
      expect(useUIStore.getState().hideValues).toBe(true)
    })

    it('disables hideValues when enabled', () => {
      // Arrange
      useUIStore.setState({ hideValues: true })
      const sut = useUIStore.getState()
      expect(sut.hideValues).toBe(true)

      // Act
      sut.toggleHideValues()

      // Assert
      expect(useUIStore.getState().hideValues).toBe(false)
    })

    it('toggles multiple times correctly', () => {
      // Arrange
      const sut = useUIStore.getState()

      // Act & Assert
      sut.toggleHideValues()
      expect(useUIStore.getState().hideValues).toBe(true)

      sut.toggleHideValues()
      expect(useUIStore.getState().hideValues).toBe(false)

      sut.toggleHideValues()
      expect(useUIStore.getState().hideValues).toBe(true)
    })
  })

  describe('state independence', () => {
    it('toggleSidebar does not affect hideValues', () => {
      // Arrange
      useUIStore.setState({ hideValues: true })
      const sut = useUIStore.getState()

      // Act
      sut.toggleSidebar()

      // Assert
      expect(useUIStore.getState().hideValues).toBe(true)
    })

    it('toggleHideValues does not affect sidebarOpen', () => {
      // Arrange
      useUIStore.setState({ sidebarOpen: false })
      const sut = useUIStore.getState()

      // Act
      sut.toggleHideValues()

      // Assert
      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('setSidebarOpen does not affect hideValues', () => {
      // Arrange
      useUIStore.setState({ hideValues: true })
      const sut = useUIStore.getState()

      // Act
      sut.setSidebarOpen(false)

      // Assert
      expect(useUIStore.getState().hideValues).toBe(true)
    })
  })
})
