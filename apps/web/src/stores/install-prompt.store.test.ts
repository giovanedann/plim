import { beforeEach, describe, expect, it } from 'vitest'
import { useInstallPromptStore } from './install-prompt.store'

describe('useInstallPromptStore', () => {
  beforeEach(() => {
    useInstallPromptStore.setState({
      dismissed: false,
      showIOSOverlay: false,
    })
  })

  describe('initial state', () => {
    it('has dismissed as false by default', () => {
      const sut = useInstallPromptStore.getState()

      expect(sut.dismissed).toBe(false)
    })

    it('has showIOSOverlay as false by default', () => {
      const sut = useInstallPromptStore.getState()

      expect(sut.showIOSOverlay).toBe(false)
    })
  })

  describe('dismiss', () => {
    it('sets dismissed to true', () => {
      const sut = useInstallPromptStore.getState()

      sut.dismiss()

      expect(useInstallPromptStore.getState().dismissed).toBe(true)
    })

    it('closes iOS overlay when dismissing', () => {
      useInstallPromptStore.setState({ showIOSOverlay: true })
      const sut = useInstallPromptStore.getState()

      sut.dismiss()

      expect(useInstallPromptStore.getState().showIOSOverlay).toBe(false)
    })
  })

  describe('openIOSOverlay', () => {
    it('sets showIOSOverlay to true', () => {
      const sut = useInstallPromptStore.getState()

      sut.openIOSOverlay()

      expect(useInstallPromptStore.getState().showIOSOverlay).toBe(true)
    })

    it('does not affect dismissed state', () => {
      const sut = useInstallPromptStore.getState()

      sut.openIOSOverlay()

      expect(useInstallPromptStore.getState().dismissed).toBe(false)
    })
  })

  describe('closeIOSOverlay', () => {
    it('sets showIOSOverlay to false', () => {
      useInstallPromptStore.setState({ showIOSOverlay: true })
      const sut = useInstallPromptStore.getState()

      sut.closeIOSOverlay()

      expect(useInstallPromptStore.getState().showIOSOverlay).toBe(false)
    })

    it('does not affect dismissed state', () => {
      useInstallPromptStore.setState({ dismissed: true, showIOSOverlay: true })
      const sut = useInstallPromptStore.getState()

      sut.closeIOSOverlay()

      expect(useInstallPromptStore.getState().dismissed).toBe(true)
    })
  })
})
