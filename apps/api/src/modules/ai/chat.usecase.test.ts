import { createMockCategory, createMockChatOutput } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateExpenseUseCase } from '../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../expenses/expenses.repository'
import type { AIRepository, CachedResponse } from './ai.repository'
import { ChatUseCase, type ChatUseCaseDependencies, type ChatUseCaseInput } from './chat.usecase'
import type { AIClient, ChatOutput } from './client'

function createMockAIClient(): { chat: ReturnType<typeof vi.fn> } {
  return {
    chat: vi.fn(),
  }
}

function createMockAIRepository(): {
  generateCacheKey: ReturnType<typeof vi.fn>
  getCachedResponse: ReturnType<typeof vi.fn>
  setCachedResponse: ReturnType<typeof vi.fn>
  logUsage: ReturnType<typeof vi.fn>
} {
  return {
    generateCacheKey: vi.fn().mockReturnValue('cache-key-123'),
    getCachedResponse: vi.fn(),
    setCachedResponse: vi.fn(),
    logUsage: vi.fn(),
  }
}

function createMockSupabase(): {
  from: ReturnType<typeof vi.fn>
} {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }
}

function createMockCreateExpenseUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return {
    execute: vi.fn(),
  }
}

function createMockExpensesRepository(): { findByUserId: ReturnType<typeof vi.fn> } {
  return {
    findByUserId: vi.fn().mockResolvedValue([]),
  }
}

describe('ChatUseCase', () => {
  let sut: ChatUseCase
  let mockAIClient: ReturnType<typeof createMockAIClient>
  let mockAIRepository: ReturnType<typeof createMockAIRepository>
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let mockCreateExpenseUseCase: ReturnType<typeof createMockCreateExpenseUseCase>
  let mockExpensesRepository: ReturnType<typeof createMockExpensesRepository>

  const userId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    mockAIClient = createMockAIClient()
    mockAIRepository = createMockAIRepository()
    mockSupabase = createMockSupabase()
    mockCreateExpenseUseCase = createMockCreateExpenseUseCase()
    mockExpensesRepository = createMockExpensesRepository()

    const deps: ChatUseCaseDependencies = {
      aiClient: mockAIClient as unknown as AIClient,
      aiRepository: mockAIRepository as unknown as AIRepository,
      supabase: mockSupabase as never,
      createExpenseUseCase: mockCreateExpenseUseCase as unknown as CreateExpenseUseCase,
      expensesRepository: mockExpensesRepository as unknown as ExpensesRepository,
    }

    sut = new ChatUseCase(deps)
  })

  describe('cache behavior', () => {
    it('returns cached response for text request on cache hit', async () => {
      const cached: CachedResponse = {
        id: 'cache-1',
        user_id: userId,
        cache_key: 'cache-key-123',
        request_type: 'text',
        response_message: 'Cached response message',
        response_action: { type: 'query_result', data: { total: 5000 } },
        tokens_saved: 150,
        created_at: '2026-01-15T11:00:00.000Z',
        expires_at: '2026-01-15T13:00:00.000Z',
      }
      mockAIRepository.getCachedResponse.mockResolvedValue(cached)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'How much did I spend?' }] }],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.message).toBe('Cached response message')
      expect(result.action).toEqual({ type: 'query_result', data: { total: 5000 } })
      expect(result.tokensUsed).toBe(0)
      expect(mockAIClient.chat).not.toHaveBeenCalled()
      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'text', 'cache_hit', 0)
    })

    it('calls AI on cache miss and caches response', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      const aiResponse: ChatOutput = createMockChatOutput({
        text: 'AI generated response',
        functionCall: null,
        tokensUsed: 200,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.message).toBe('AI generated response')
      expect(result.tokensUsed).toBe(200)
      expect(mockAIClient.chat).toHaveBeenCalled()
      expect(mockAIRepository.setCachedResponse).toHaveBeenCalledWith(
        userId,
        'cache-key-123',
        'text',
        'AI generated response',
        null,
        200
      )
    })

    it('skips cache check for voice requests', async () => {
      const aiResponse: ChatOutput = createMockChatOutput({
        text: 'Voice response',
        tokensUsed: 100,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [
          {
            role: 'user',
            content: [{ type: 'audio', data: 'base64data', mimeType: 'audio/webm' }],
          },
        ],
        requestType: 'voice',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.getCachedResponse).not.toHaveBeenCalled()
      expect(mockAIRepository.setCachedResponse).not.toHaveBeenCalled()
    })

    it('skips cache check for image requests', async () => {
      const aiResponse: ChatOutput = createMockChatOutput({
        text: 'Image response',
        tokensUsed: 100,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [
          {
            role: 'user',
            content: [{ type: 'image', data: 'base64data', mimeType: 'image/jpeg' }],
          },
        ],
        requestType: 'image',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.getCachedResponse).not.toHaveBeenCalled()
      expect(mockAIRepository.setCachedResponse).not.toHaveBeenCalled()
    })
  })

  describe('function calling', () => {
    it('executes create_expense function and returns result', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)

      const category = createMockCategory({ id: 'cat-1', name: 'Alimentação' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'profile') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      const createdExpense = { id: 'exp-1', description: 'Almoço', amount_cents: 3500 }
      mockCreateExpenseUseCase.execute.mockResolvedValue(createdExpense)

      const aiResponse: ChatOutput = createMockChatOutput({
        text: null,
        functionCall: {
          name: 'create_expense',
          args: {
            description: 'Almoço',
            amount_cents: 3500,
            category_name: 'Alimentação',
            payment_method: 'pix',
            date: '2026-01-15',
          },
        },
        tokensUsed: 150,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Almoço de R$35 no pix' }] }],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.action?.type).toBe('expense_created')
      expect(result.message).toContain('Despesa criada')
      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'text', 'create_expense', 150)
    })

    it('executes query_expenses function', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      mockExpensesRepository.findByUserId.mockResolvedValue([
        { id: 'exp-1', amount_cents: 5000, description: 'Test' },
      ])

      const aiResponse: ChatOutput = createMockChatOutput({
        text: null,
        functionCall: {
          name: 'query_expenses',
          args: {
            start_date: '2026-01-01',
            end_date: '2026-01-31',
          },
        },
        tokensUsed: 100,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Quanto gastei esse mês?' }] }],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.action?.type).toBe('query_result')
      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'text', 'query_expenses', 100)
    })

    it('executes forecast_spending function', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      mockExpensesRepository.findByUserId.mockResolvedValue([])
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'expense') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'profile') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      const aiResponse: ChatOutput = createMockChatOutput({
        text: null,
        functionCall: {
          name: 'forecast_spending',
          args: {
            months_ahead: 3,
          },
        },
        tokensUsed: 120,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: 'Quanto vou gastar nos próximos 3 meses?' }],
          },
        ],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.action?.type).toBe('forecast_result')
      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(
        userId,
        'text',
        'forecast_spending',
        120
      )
    })
  })

  describe('usage logging', () => {
    it('logs correct request type for text', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      mockAIClient.chat.mockResolvedValue(
        createMockChatOutput({ text: 'Response', tokensUsed: 50 })
      )

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        requestType: 'text',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'text', 'chat', 50)
    })

    it('logs correct request type for voice', async () => {
      mockAIClient.chat.mockResolvedValue(
        createMockChatOutput({ text: 'Response', tokensUsed: 75 })
      )

      const input: ChatUseCaseInput = {
        messages: [
          { role: 'user', content: [{ type: 'audio', data: 'base64', mimeType: 'audio/webm' }] },
        ],
        requestType: 'voice',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'voice', 'chat', 75)
    })

    it('logs correct request type for image', async () => {
      mockAIClient.chat.mockResolvedValue(
        createMockChatOutput({ text: 'Response', tokensUsed: 100 })
      )

      const input: ChatUseCaseInput = {
        messages: [
          { role: 'user', content: [{ type: 'image', data: 'base64', mimeType: 'image/jpeg' }] },
        ],
        requestType: 'image',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'image', 'chat', 100)
    })

    it('logs 0 tokens on cache hit', async () => {
      const cached: CachedResponse = {
        id: 'cache-1',
        user_id: userId,
        cache_key: 'cache-key-123',
        request_type: 'text',
        response_message: 'Cached',
        response_action: null,
        tokens_saved: 100,
        created_at: '2026-01-15T11:00:00.000Z',
        expires_at: '2026-01-15T13:00:00.000Z',
      }
      mockAIRepository.getCachedResponse.mockResolvedValue(cached)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        requestType: 'text',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.logUsage).toHaveBeenCalledWith(userId, 'text', 'cache_hit', 0)
    })
  })

  describe('error handling', () => {
    it('propagates AI client errors', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      mockAIClient.chat.mockRejectedValue(new Error('AI service unavailable'))

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        requestType: 'text',
      }

      await expect(sut.execute(userId, input)).rejects.toThrow('AI service unavailable')
    })

    it('returns default message when AI returns null text', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)
      mockAIClient.chat.mockResolvedValue(createMockChatOutput({ text: null, tokensUsed: 50 }))

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        requestType: 'text',
      }

      const result = await sut.execute(userId, input)

      expect(result.message).toBe('Desculpe, não consegui processar sua mensagem.')
    })
  })

  describe('does not cache expense_created responses', () => {
    it('does not cache when expense is created', async () => {
      mockAIRepository.getCachedResponse.mockResolvedValue(null)

      const category = createMockCategory({ id: 'cat-1', name: 'Alimentação' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'profile') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      })

      mockCreateExpenseUseCase.execute.mockResolvedValue({ id: 'exp-1' })

      const aiResponse: ChatOutput = createMockChatOutput({
        text: null,
        functionCall: {
          name: 'create_expense',
          args: {
            description: 'Almoço',
            amount_cents: 3500,
            category_name: 'Alimentação',
            payment_method: 'pix',
            date: '2026-01-15',
          },
        },
        tokensUsed: 150,
      })
      mockAIClient.chat.mockResolvedValue(aiResponse)

      const input: ChatUseCaseInput = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Almoço de R$35' }] }],
        requestType: 'text',
      }

      await sut.execute(userId, input)

      expect(mockAIRepository.setCachedResponse).toHaveBeenCalledWith(
        userId,
        'cache-key-123',
        'text',
        expect.stringContaining('Despesa criada'),
        expect.objectContaining({ type: 'expense_created' }),
        150
      )
    })
  })
})
