import { createMockAIUsageResponse } from '@plim/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAIStore } from './ai.store'

describe('useAIStore', () => {
  beforeEach(() => {
    useAIStore.setState({
      isDrawerOpen: false,
      isRecording: false,
      isPulsing: false,
      messages: [],
      usage: null,
    })
  })

  describe('initial state', () => {
    it('has drawer closed by default', () => {
      const sut = useAIStore.getState()

      expect(sut.isDrawerOpen).toBe(false)
    })

    it('has no messages by default', () => {
      const sut = useAIStore.getState()

      expect(sut.messages).toEqual([])
    })

    it('has no usage data by default', () => {
      const sut = useAIStore.getState()

      expect(sut.usage).toBeNull()
    })

    it('has recording disabled by default', () => {
      const sut = useAIStore.getState()

      expect(sut.isRecording).toBe(false)
    })

    it('has pulsing disabled by default', () => {
      const sut = useAIStore.getState()

      expect(sut.isPulsing).toBe(false)
    })
  })

  describe('openDrawer', () => {
    it('opens the drawer', () => {
      const sut = useAIStore.getState()

      sut.openDrawer()

      expect(useAIStore.getState().isDrawerOpen).toBe(true)
    })
  })

  describe('closeDrawer', () => {
    it('closes the drawer', () => {
      useAIStore.setState({ isDrawerOpen: true })
      const sut = useAIStore.getState()

      sut.closeDrawer()

      expect(useAIStore.getState().isDrawerOpen).toBe(false)
    })
  })

  describe('toggleDrawer', () => {
    it('opens drawer when closed', () => {
      const sut = useAIStore.getState()
      expect(sut.isDrawerOpen).toBe(false)

      sut.toggleDrawer()

      expect(useAIStore.getState().isDrawerOpen).toBe(true)
    })

    it('closes drawer when open', () => {
      useAIStore.setState({ isDrawerOpen: true })
      const sut = useAIStore.getState()

      sut.toggleDrawer()

      expect(useAIStore.getState().isDrawerOpen).toBe(false)
    })

    it('toggles multiple times correctly', () => {
      const sut = useAIStore.getState()

      sut.toggleDrawer()
      expect(useAIStore.getState().isDrawerOpen).toBe(true)

      sut.toggleDrawer()
      expect(useAIStore.getState().isDrawerOpen).toBe(false)

      sut.toggleDrawer()
      expect(useAIStore.getState().isDrawerOpen).toBe(true)
    })
  })

  describe('addMessage', () => {
    it('appends message with unique ID', () => {
      const sut = useAIStore.getState()

      sut.addMessage({
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      })

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0]!.role).toBe('user')
      expect(messages[0]!.content).toEqual([{ type: 'text', text: 'Hello' }])
      expect(messages[0]!.id).toBeDefined()
      expect(messages[0]!.id).toMatch(/^msg-/)
    })

    it('generates unique IDs for each message', () => {
      const sut = useAIStore.getState()

      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'First' }] })
      sut.addMessage({ role: 'assistant', content: [{ type: 'text', text: 'Response' }] })

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(2)
      expect(messages[0]!.id).not.toBe(messages[1]!.id)
    })

    it('preserves existing messages when adding', () => {
      const sut = useAIStore.getState()

      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'First' }] })
      sut.addMessage({ role: 'assistant', content: [{ type: 'text', text: 'Response' }] })
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Second' }] })

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(3)
      expect(messages[0]!.content[0]).toEqual({ type: 'text', text: 'First' })
      expect(messages[1]!.content[0]).toEqual({ type: 'text', text: 'Response' })
      expect(messages[2]!.content[0]).toEqual({ type: 'text', text: 'Second' })
    })

    it('handles multimodal content', () => {
      const sut = useAIStore.getState()

      sut.addMessage({
        role: 'user',
        content: [
          { type: 'text', text: 'Check this image' },
          { type: 'image', data: 'base64data', mimeType: 'image/jpeg' },
        ],
      })

      const messages = useAIStore.getState().messages
      expect(messages[0]!.content).toHaveLength(2)
    })
  })

  describe('clearMessages', () => {
    it('empties the messages array', () => {
      const sut = useAIStore.getState()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })
      sut.addMessage({ role: 'assistant', content: [{ type: 'text', text: 'Hi' }] })
      expect(useAIStore.getState().messages).toHaveLength(2)

      sut.clearMessages()

      expect(useAIStore.getState().messages).toEqual([])
    })

    it('can add messages after clearing', () => {
      const sut = useAIStore.getState()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'First' }] })
      sut.clearMessages()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'New first' }] })

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0]!.content[0]).toEqual({ type: 'text', text: 'New first' })
    })
  })

  describe('setUsage', () => {
    it('updates usage info', () => {
      const sut = useAIStore.getState()
      const usageInfo = createMockAIUsageResponse({
        tier: 'free',
        text: { used: 10, limit: 30, remaining: 20 },
      })

      sut.setUsage(usageInfo)

      expect(useAIStore.getState().usage).toEqual(usageInfo)
    })

    it('replaces previous usage info', () => {
      const sut = useAIStore.getState()
      const initialUsage = createMockAIUsageResponse({
        text: { used: 5, limit: 30, remaining: 25 },
      })
      const updatedUsage = createMockAIUsageResponse({
        text: { used: 10, limit: 30, remaining: 20 },
      })

      sut.setUsage(initialUsage)
      sut.setUsage(updatedUsage)

      expect(useAIStore.getState().usage?.text.used).toBe(10)
    })
  })

  describe('setRecording', () => {
    it('enables recording', () => {
      const sut = useAIStore.getState()

      sut.setRecording(true)

      expect(useAIStore.getState().isRecording).toBe(true)
    })

    it('disables recording', () => {
      useAIStore.setState({ isRecording: true })
      const sut = useAIStore.getState()

      sut.setRecording(false)

      expect(useAIStore.getState().isRecording).toBe(false)
    })
  })

  describe('setPulsing', () => {
    it('enables pulsing', () => {
      const sut = useAIStore.getState()

      sut.setPulsing(true)

      expect(useAIStore.getState().isPulsing).toBe(true)
    })

    it('disables pulsing', () => {
      useAIStore.setState({ isPulsing: true })
      const sut = useAIStore.getState()

      sut.setPulsing(false)

      expect(useAIStore.getState().isPulsing).toBe(false)
    })
  })

  describe('state independence', () => {
    it('openDrawer does not affect messages', () => {
      const sut = useAIStore.getState()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })

      sut.openDrawer()

      expect(useAIStore.getState().messages).toHaveLength(1)
    })

    it('addMessage does not affect drawer state', () => {
      useAIStore.setState({ isDrawerOpen: true })
      const sut = useAIStore.getState()

      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })

      expect(useAIStore.getState().isDrawerOpen).toBe(true)
    })

    it('clearMessages does not affect usage', () => {
      const sut = useAIStore.getState()
      const usageInfo = createMockAIUsageResponse()
      sut.setUsage(usageInfo)
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })

      sut.clearMessages()

      expect(useAIStore.getState().usage).toEqual(usageInfo)
    })

    it('setUsage does not affect messages', () => {
      const sut = useAIStore.getState()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })

      sut.setUsage(createMockAIUsageResponse())

      expect(useAIStore.getState().messages).toHaveLength(1)
    })
  })

  describe('persistence', () => {
    it('store name is set for localStorage persistence', () => {
      expect(useAIStore.persist.getOptions().name).toBe('plim-ai-store')
    })

    it('only messages are persisted (partialize)', () => {
      const sut = useAIStore.getState()
      sut.addMessage({ role: 'user', content: [{ type: 'text', text: 'Hello' }] })
      sut.setUsage(createMockAIUsageResponse())
      sut.openDrawer()

      const partialize = useAIStore.persist.getOptions().partialize
      if (partialize) {
        const persisted = partialize(useAIStore.getState())
        expect(persisted).toHaveProperty('messages')
        expect(persisted).not.toHaveProperty('isDrawerOpen')
        expect(persisted).not.toHaveProperty('usage')
      }
    })
  })
})
