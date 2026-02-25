import {
  createErrorResponse,
  createMockAIChatResponse,
  createMockAIUsageResponse,
  createSuccessResponse,
} from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAIChat } from './use-ai-chat'

vi.mock('@/services', () => ({
  aiService: {
    chat: vi.fn(),
  },
}))

const mockStartTutorialById = vi.fn()

const mockCloseDrawer = vi.fn()

vi.mock('@/stores', () => {
  const useAIStore = Object.assign(vi.fn(), {
    getState: () => ({
      closeDrawer: mockCloseDrawer,
    }),
  })
  return {
    useAIStore,
    useTutorialStore: {
      getState: () => ({
        startTutorialById: mockStartTutorialById,
      }),
    },
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { aiService } from '@/services'
import { useAIStore } from '@/stores'
import { toast } from 'sonner'

type MockAIStore = {
  messages: Array<{ role: string; content: Array<{ type: string; text?: string }> }>
  addMessage: ReturnType<typeof vi.fn>
  setUsage: ReturnType<typeof vi.fn>
  setPulsing: ReturnType<typeof vi.fn>
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAIChat', () => {
  let mockStore: MockAIStore

  beforeEach(() => {
    vi.clearAllMocks()

    mockStore = {
      messages: [],
      addMessage: vi.fn(),
      setUsage: vi.fn(),
      setPulsing: vi.fn(),
    }

    vi.mocked(useAIStore).mockReturnValue(mockStore)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('sendMessage', () => {
    it('adds user message, calls API, and adds assistant message', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Despesa criada com sucesso',
        usageInfo: createMockAIUsageResponse(),
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Almoço de R$35' }])
      })

      expect(mockStore.addMessage).toHaveBeenCalledTimes(2)
      expect(mockStore.addMessage).toHaveBeenNthCalledWith(1, {
        role: 'user',
        content: [{ type: 'text', text: 'Almoço de R$35' }],
      })
      expect(mockStore.addMessage).toHaveBeenNthCalledWith(2, {
        role: 'assistant',
        content: [{ type: 'text', text: 'Despesa criada com sucesso' }],
      })
    })

    it('calls aiService.chat with all conversation messages', async () => {
      mockStore.messages = [
        { role: 'user', content: [{ type: 'text', text: 'Previous message' }] },
        { role: 'assistant', content: [{ type: 'text', text: 'Previous response' }] },
      ]
      vi.mocked(useAIStore).mockReturnValue(mockStore)

      const chatResponse = createMockAIChatResponse()
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'New message' }])
      })

      expect(aiService.chat).toHaveBeenCalledWith({
        messages: [
          { role: 'user', content: [{ type: 'text', text: 'Previous message' }] },
          { role: 'assistant', content: [{ type: 'text', text: 'Previous response' }] },
          { role: 'user', content: [{ type: 'text', text: 'New message' }] },
        ],
      })
    })

    it('updates usage after successful response', async () => {
      const usageInfo = createMockAIUsageResponse({
        text: { used: 10, limit: 30, remaining: 20 },
      })
      const chatResponse = createMockAIChatResponse({ usageInfo })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(mockStore.setUsage).toHaveBeenCalledWith(usageInfo)
    })

    it('triggers pulsing animation after response', async () => {
      const chatResponse = createMockAIChatResponse()
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(mockStore.setPulsing).toHaveBeenCalledWith(true)
    })
  })

  describe('30s timeout', () => {
    it('sets error and shows toast on timeout', async () => {
      vi.useFakeTimers()

      vi.mocked(aiService.chat).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 40000))
      )

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      act(() => {
        result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(31000)
      })

      expect(result.current.error).toBe('A requisição demorou muito. Tente novamente.')
      expect(toast.error).toHaveBeenCalledWith('A requisição demorou muito. Tente novamente.')
      expect(result.current.isLoading).toBe(false)
    })

    it('does not add assistant message on timeout', async () => {
      vi.useFakeTimers()

      vi.mocked(aiService.chat).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 40000))
      )

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      act(() => {
        result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(31000)
      })

      expect(result.current.isLoading).toBe(false)
      expect(mockStore.addMessage).toHaveBeenCalledTimes(1)
      expect(mockStore.addMessage).toHaveBeenCalledWith({
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      })
    })
  })

  describe('API error handling', () => {
    it('sets error and shows toast on API error response', async () => {
      vi.mocked(aiService.chat).mockResolvedValue(
        createErrorResponse('FORBIDDEN', 'Rate limit exceeded')
      )

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(result.current.error).toBe('Você atingiu o limite semanal. Atualize para o Pro!')
      expect(toast.error).toHaveBeenCalledWith(
        'Você atingiu o limite semanal. Atualize para o Pro!',
        expect.objectContaining({
          action: expect.objectContaining({ label: 'Ver planos' }),
        })
      )
    })

    it('does not add assistant message on API error', async () => {
      vi.mocked(aiService.chat).mockResolvedValue(
        createErrorResponse('INTERNAL_ERROR', 'Server error')
      )

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(mockStore.addMessage).toHaveBeenCalledTimes(1)
    })

    it('sets generic error on network failure', async () => {
      vi.mocked(aiService.chat).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(result.current.error).toBe('Erro ao processar mensagem. Tente novamente.')
      expect(toast.error).toHaveBeenCalledWith('Erro ao processar mensagem. Tente novamente.')
    })
  })

  describe('expense_created action', () => {
    it('invalidates queries and shows success toast', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Despesa criada',
        action: { type: 'expense_created', data: { id: 'exp-1' } },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Almoço R$35' }])
      })

      expect(toast.success).toHaveBeenCalledWith('Despesa criada com sucesso!', {
        description: 'Sua despesa foi registrada.',
      })
    })
  })

  describe('loading state', () => {
    it('is true during request', async () => {
      let resolvePromise: (value: unknown) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(aiService.chat).mockReturnValue(pendingPromise as never)

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolvePromise!(createSuccessResponse(createMockAIChatResponse()))
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('is false after error', async () => {
      vi.mocked(aiService.chat).mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('show_tutorial action', () => {
    it('calls startTutorialById when response has show_tutorial action', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Vou te mostrar como adicionar uma despesa!',
        action: { type: 'show_tutorial', data: { tutorial_id: 'add-expense' } },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Como adiciono uma despesa?' }])
      })

      expect(mockStartTutorialById).toHaveBeenCalledWith('add-expense')
    })

    it('does not create expense when tutorial action is returned', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Vou te mostrar como adicionar uma despesa!',
        action: { type: 'show_tutorial', data: { tutorial_id: 'add-expense' } },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Como adiciono uma despesa?' }])
      })

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('does not call startTutorialById for non-tutorial actions', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Despesa criada',
        action: { type: 'expense_created', data: { id: 'exp-1' } },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Almoço R$35' }])
      })

      expect(mockStartTutorialById).not.toHaveBeenCalled()
    })

    it('does not call startTutorialById when action has no data', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Não entendi o que quer dizer.',
        action: undefined,
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Hello' }])
      })

      expect(mockStartTutorialById).not.toHaveBeenCalled()
    })
  })

  describe('credit_card_updated action', () => {
    it('invalidates credit card queries and shows success toast', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Cartão Nubank atualizado: dia de fechamento para 10.',
        action: {
          type: 'credit_card_updated',
          data: { id: 'cc-1', name: 'Nubank', closing_day: 10 },
        },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([
          { type: 'text', text: 'Altere o fechamento do Nubank para dia 10' },
        ])
      })

      expect(toast.success).toHaveBeenCalledWith('Cartão atualizado com sucesso!', {
        description: 'As informações do cartão foram atualizadas.',
      })
    })

    it('does not trigger expense_created toast for credit_card_updated action', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Cartão atualizado',
        action: { type: 'credit_card_updated', data: { id: 'cc-1' } },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Atualize meu cartão' }])
      })

      expect(toast.success).not.toHaveBeenCalledWith(
        'Despesa criada com sucesso!',
        expect.anything()
      )
    })
  })

  describe('invoice_result action', () => {
    it('does not show any toast for invoice_result action', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Fatura Nubank - 2026-01: Total R$1.500,00',
        action: {
          type: 'invoice_result',
          data: {
            invoice: { id: 'inv-1', total_amount_cents: 150000 },
            transaction_count: 5,
            remaining_cents: 150000,
          },
        },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([
          { type: 'text', text: 'Qual o valor da fatura do Nubank?' },
        ])
      })

      expect(toast.success).not.toHaveBeenCalled()
    })

    it('adds assistant message with invoice information', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Fatura Nubank - 2026-01:\nTotal: R$1.500,00\nPago: R$0,00',
        action: {
          type: 'invoice_result',
          data: {
            invoice: { id: 'inv-1', total_amount_cents: 150000 },
            transaction_count: 5,
            remaining_cents: 150000,
          },
        },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([
          { type: 'text', text: 'Qual o valor da fatura do Nubank?' },
        ])
      })

      expect(mockStore.addMessage).toHaveBeenCalledWith({
        role: 'assistant',
        content: [
          { type: 'text', text: 'Fatura Nubank - 2026-01:\nTotal: R$1.500,00\nPago: R$0,00' },
        ],
      })
    })
  })

  describe('invoice_paid action', () => {
    it('invalidates invoice queries and shows success toast', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Fatura de 2026-01 do cartão Nubank paga integralmente: R$1.500,00.',
        action: {
          type: 'invoice_paid',
          data: { id: 'inv-1', status: 'paid', paid_amount_cents: 150000 },
        },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Pague a fatura do Nubank' }])
      })

      expect(toast.success).toHaveBeenCalledWith('Pagamento registrado!', {
        description: 'O pagamento da fatura foi registrado.',
      })
    })

    it('does not show toast when invoice_paid has no data', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'A fatura já está paga.',
        action: { type: 'invoice_paid' },
      })
      vi.mocked(aiService.chat).mockResolvedValue(createSuccessResponse(chatResponse))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Pague a fatura do Nubank' }])
      })

      expect(toast.success).not.toHaveBeenCalled()
    })
  })

  describe('error state', () => {
    it('is null initially', () => {
      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      expect(result.current.error).toBeNull()
    })

    it('is cleared on new message', async () => {
      vi.mocked(aiService.chat)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(createSuccessResponse(createMockAIChatResponse()))

      const { result } = renderHook(() => useAIChat(), { wrapper: createWrapper() })

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'First' }])
      })

      expect(result.current.error).not.toBeNull()

      await act(async () => {
        await result.current.sendMessage([{ type: 'text', text: 'Second' }])
      })

      expect(result.current.error).toBeNull()
    })
  })
})
