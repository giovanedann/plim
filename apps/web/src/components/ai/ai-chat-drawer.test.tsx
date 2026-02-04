import { createMockAIUsageResponse, createMockProfile } from '@plim/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AIChatDrawer } from './ai-chat-drawer'

vi.mock('@/hooks/use-ai-chat', () => ({
  useAIChat: vi.fn(),
}))

vi.mock('@/hooks/use-profile', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/stores/ai.store', () => ({
  useAIStore: vi.fn(),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import { useAIChat } from '@/hooks/use-ai-chat'
import { useProfile } from '@/hooks/use-profile'
import { type StoredChatMessage, useAIStore } from '@/stores/ai.store'
import { useAuthStore } from '@/stores/auth.store'

type MockAIStore = {
  isDrawerOpen: boolean
  closeDrawer: ReturnType<typeof vi.fn>
  messages: StoredChatMessage[]
  usage: ReturnType<typeof createMockAIUsageResponse> | null
}

type MockAIChat = {
  sendMessage: ReturnType<typeof vi.fn>
  isLoading: boolean
  error: string | null
}

describe('AIChatDrawer', () => {
  let mockStore: MockAIStore
  let mockAIChat: MockAIChat

  beforeEach(() => {
    vi.clearAllMocks()

    mockStore = {
      isDrawerOpen: true,
      closeDrawer: vi.fn(),
      messages: [],
      usage: createMockAIUsageResponse(),
    }

    mockAIChat = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      error: null,
    }

    vi.mocked(useAIStore).mockReturnValue(mockStore)
    vi.mocked(useAIChat).mockReturnValue(mockAIChat)
    vi.mocked(useProfile).mockReturnValue({
      profile: createMockProfile({ name: 'Test User' }),
      isLoading: false,
      error: null,
    })
    vi.mocked(useAuthStore).mockReturnValue({
      user: { email: 'test@example.com', user_metadata: {} },
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('visibility', () => {
    it('renders when drawer is open', () => {
      mockStore.isDrawerOpen = true
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Assistente Plim')).toBeInTheDocument()
    })

    it('closes drawer on sheet close', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockStore.closeDrawer).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('shows greeting message when no messages', () => {
      mockStore.messages = []
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Olá! Sou seu assistente.')).toBeInTheDocument()
    })

    it('shows example prompts', () => {
      mockStore.messages = []
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('"Comprei um almoço de R$35 no cartão"')).toBeInTheDocument()
      expect(screen.getByText('"Quanto gastei esse mês?"')).toBeInTheDocument()
      expect(screen.getByText('"Quanto vou gastar até março?"')).toBeInTheDocument()
    })

    it('shows AI disclaimer', () => {
      mockStore.messages = []
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText(/A IA pode cometer erros/)).toBeInTheDocument()
    })
  })

  describe('messages', () => {
    it('renders user message with avatar', () => {
      mockStore.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: [{ type: 'text', text: 'Hello from user' }],
        },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Hello from user')).toBeInTheDocument()
    })

    it('renders assistant message with bot avatar', () => {
      mockStore.messages = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello from assistant' }],
        },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Hello from assistant')).toBeInTheDocument()
    })

    it('renders multiple messages in conversation', () => {
      mockStore.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: [{ type: 'text', text: 'First message' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response message' }],
        },
        {
          id: 'msg-3',
          role: 'user',
          content: [{ type: 'text', text: 'Follow up' }],
        },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Response message')).toBeInTheDocument()
      expect(screen.getByText('Follow up')).toBeInTheDocument()
    })

    it('shows image indicator for image messages', () => {
      mockStore.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: [
            { type: 'text', text: 'Check this' },
            { type: 'image', data: 'base64', mimeType: 'image/jpeg' },
          ],
        },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Imagem enviada')).toBeInTheDocument()
    })

    it('shows audio indicator for voice messages', () => {
      mockStore.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: [{ type: 'audio', data: 'base64', mimeType: 'audio/webm' }],
        },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Áudio enviado')).toBeInTheDocument()
    })
  })

  describe('typing indicator', () => {
    it('shows typing indicator during loading', () => {
      mockAIChat.isLoading = true
      vi.mocked(useAIChat).mockReturnValue(mockAIChat)
      mockStore.messages = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      const dots = document.querySelectorAll('.rounded-full.bg-muted-foreground\\/60')
      expect(dots.length).toBeGreaterThanOrEqual(3)
    })

    it('hides typing indicator when not loading', () => {
      mockAIChat.isLoading = false
      vi.mocked(useAIChat).mockReturnValue(mockAIChat)

      render(<AIChatDrawer />)

      const typingDots = document.querySelectorAll('.rounded-full.bg-muted-foreground\\/60')
      expect(typingDots.length).toBe(0)
    })
  })

  describe('input modes', () => {
    it('shows text input by default', () => {
      render(<AIChatDrawer />)

      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    })

    it('switches to voice mode when voice button clicked', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const voiceButton = screen.getByRole('button', { name: /Voz/ })
      await user.click(voiceButton)

      expect(screen.getByText(/máx 10s/)).toBeInTheDocument()
    })

    it('switches to image mode when image button clicked', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const imageButton = screen.getByRole('button', { name: /Foto/ })
      await user.click(imageButton)

      expect(screen.getByText(/máx 10MB/)).toBeInTheDocument()
    })

    it('switches back to text mode', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const voiceButton = screen.getByRole('button', { name: /Voz/ })
      await user.click(voiceButton)

      const textButton = screen.getByRole('button', { name: /Texto/ })
      await user.click(textButton)

      expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
    })
  })

  describe('text input', () => {
    it('sends message on Enter key', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(textarea, 'Hello{enter}')

      expect(mockAIChat.sendMessage).toHaveBeenCalledWith([{ type: 'text', text: 'Hello' }])
    })

    it('inserts newline on Shift+Enter', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(textarea, 'Line 1{shift>}{enter}{/shift}Line 2')

      expect(textarea).toHaveValue('Line 1\nLine 2')
      expect(mockAIChat.sendMessage).not.toHaveBeenCalled()
    })

    it('clears input after sending', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(textarea, 'Hello{enter}')

      expect(textarea).toHaveValue('')
    })

    it('does not send empty message', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(textarea, '   {enter}')

      expect(mockAIChat.sendMessage).not.toHaveBeenCalled()
    })

    it('disables send button when input is empty', () => {
      render(<AIChatDrawer />)

      const sendButton = screen.getByRole('button', { name: '' })
      expect(sendButton).toBeDisabled()
    })

    it('enables send button when input has text', async () => {
      const user = userEvent.setup()
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      await user.type(textarea, 'Hello')

      const buttons = screen.getAllByRole('button')
      const sendButton = buttons.find(
        (btn) =>
          !btn.textContent?.includes('Texto') &&
          !btn.textContent?.includes('Voz') &&
          !btn.textContent?.includes('Foto')
      )
      expect(sendButton).not.toBeDisabled()
    })

    it('disables input during loading', () => {
      mockAIChat.isLoading = true
      vi.mocked(useAIChat).mockReturnValue(mockAIChat)

      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      expect(textarea).toBeDisabled()
    })
  })

  describe('clear history', () => {
    it('shows clear history button when messages exist', () => {
      mockStore.messages = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Limpar histórico')).toBeInTheDocument()
    })

    it('hides clear history button when no messages', () => {
      mockStore.messages = []
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.queryByText('Limpar histórico')).not.toBeInTheDocument()
    })

    it('shows confirmation dialog on click', async () => {
      const user = userEvent.setup()
      mockStore.messages = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      const clearButton = screen.getByText('Limpar histórico')
      await user.click(clearButton)

      expect(screen.getByText('Limpar conversa?')).toBeInTheDocument()
      expect(screen.getByText(/Isso irá apagar todo o histórico/)).toBeInTheDocument()
    })

    it('has cancel button in confirmation', async () => {
      const user = userEvent.setup()
      mockStore.messages = [
        { id: 'msg-1', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
      ]
      const mockClearMessages = vi.fn()
      vi.mocked(useAIStore).mockReturnValue({ ...mockStore, clearMessages: mockClearMessages })

      render(<AIChatDrawer />)

      const clearButton = screen.getByText('Limpar histórico')
      await user.click(clearButton)

      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)

      expect(mockClearMessages).not.toHaveBeenCalled()
    })
  })

  describe('usage display', () => {
    it('shows text usage for text mode', () => {
      mockStore.usage = createMockAIUsageResponse({
        text: { used: 10, limit: 30, remaining: 20 },
      })
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('20 de 30 texto restantes')).toBeInTheDocument()
    })

    it('shows voice usage for voice mode', async () => {
      const user = userEvent.setup()
      mockStore.usage = createMockAIUsageResponse({
        voice: { used: 2, limit: 5, remaining: 3 },
      })
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      const voiceButton = screen.getByRole('button', { name: /Voz/ })
      await user.click(voiceButton)

      expect(screen.getByText('3 de 5 voz restantes')).toBeInTheDocument()
    })

    it('shows image usage for image mode', async () => {
      const user = userEvent.setup()
      mockStore.usage = createMockAIUsageResponse({
        image: { used: 1, limit: 5, remaining: 4 },
      })
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      const imageButton = screen.getByRole('button', { name: /Foto/ })
      await user.click(imageButton)

      expect(screen.getByText('4 de 5 imagem restantes')).toBeInTheDocument()
    })

    it('shows limit reached message when remaining is 0', () => {
      mockStore.usage = createMockAIUsageResponse({
        text: { used: 15, limit: 15, remaining: 0 },
      })
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Limite de texto atingido (15/15 usados)')).toBeInTheDocument()
    })

    it('shows default message when no usage data', () => {
      mockStore.usage = null
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      render(<AIChatDrawer />)

      expect(screen.getByText('Seu assistente financeiro inteligente')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper sheet structure', () => {
      render(<AIChatDrawer />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has sheet title', () => {
      render(<AIChatDrawer />)

      expect(screen.getByText('Assistente Plim')).toBeInTheDocument()
    })

    it('textarea is focusable', () => {
      render(<AIChatDrawer />)

      const textarea = screen.getByPlaceholderText('Digite sua mensagem...')
      expect(textarea).not.toBeDisabled()
    })
  })
})
