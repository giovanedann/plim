import {
  type AIChatRequest,
  type AIUsageResponse,
  createErrorResponse,
  createMockAIChatResponse,
  createMockAIUsageResponse,
  createSuccessResponse,
} from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aiService } from './ai.service'

vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

type MockApi = {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

describe('aiService', () => {
  let mockApi: MockApi

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi = api as unknown as MockApi
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('chat', () => {
    it('sends POST request to /ai/chat with messages', async () => {
      const chatResponse = createMockAIChatResponse({
        message: 'Despesa criada com sucesso',
        action: { type: 'expense_created', data: { id: 'exp-1' } },
      })
      mockApi.post.mockResolvedValue(createSuccessResponse(chatResponse))
      const sut = aiService

      const request: AIChatRequest = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Almoço de R$35' }] }],
      }
      const result = await sut.chat(request)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/chat', request)
      expect(result).toEqual({ data: chatResponse })
    })

    it('sends voice message', async () => {
      const chatResponse = createMockAIChatResponse({ message: 'Voice processed' })
      mockApi.post.mockResolvedValue(createSuccessResponse(chatResponse))
      const sut = aiService

      const request: AIChatRequest = {
        messages: [
          {
            role: 'user',
            content: [{ type: 'audio', data: 'base64audio', mimeType: 'audio/webm' }],
          },
        ],
      }
      const result = await sut.chat(request)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/chat', request)
      expect(result).toEqual({ data: chatResponse })
    })

    it('sends image message', async () => {
      const chatResponse = createMockAIChatResponse({ message: 'Image processed' })
      mockApi.post.mockResolvedValue(createSuccessResponse(chatResponse))
      const sut = aiService

      const request: AIChatRequest = {
        messages: [
          {
            role: 'user',
            content: [{ type: 'image', data: 'base64image', mimeType: 'image/jpeg' }],
          },
        ],
      }
      const result = await sut.chat(request)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/chat', request)
      expect(result).toEqual({ data: chatResponse })
    })

    it('sends conversation history', async () => {
      const chatResponse = createMockAIChatResponse({ message: 'Response' })
      mockApi.post.mockResolvedValue(createSuccessResponse(chatResponse))
      const sut = aiService

      const request: AIChatRequest = {
        messages: [
          { role: 'user', content: [{ type: 'text', text: 'First question' }] },
          { role: 'assistant', content: [{ type: 'text', text: 'First response' }] },
          { role: 'user', content: [{ type: 'text', text: 'Follow up' }] },
        ],
      }
      await sut.chat(request)

      expect(mockApi.post).toHaveBeenCalledWith('/ai/chat', request)
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('FORBIDDEN', 'Rate limit exceeded')
      mockApi.post.mockResolvedValue(errorResponse)
      const sut = aiService

      const request: AIChatRequest = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      }
      const result = await sut.chat(request)

      expect(result).toEqual(errorResponse)
    })

    it('handles network errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'))
      const sut = aiService

      const request: AIChatRequest = {
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      }

      await expect(sut.chat(request)).rejects.toThrow('Network error')
    })
  })

  describe('getUsage', () => {
    it('sends GET request to /ai/usage', async () => {
      const usageResponse = createMockAIUsageResponse({
        tier: 'free',
        text: { used: 10, limit: 30, remaining: 20 },
        voice: { used: 2, limit: 5, remaining: 3 },
        image: { used: 1, limit: 5, remaining: 4 },
      })
      mockApi.get.mockResolvedValue(createSuccessResponse(usageResponse))
      const sut = aiService

      const result = await sut.getUsage()

      expect(mockApi.get).toHaveBeenCalledWith('/ai/usage')
      expect(result).toEqual({ data: usageResponse })
    })

    it('returns pro tier usage', async () => {
      const usageResponse = createMockAIUsageResponse({
        tier: 'pro',
        text: { used: 50, limit: 150, remaining: 100 },
      })
      mockApi.get.mockResolvedValue(createSuccessResponse(usageResponse))
      const sut = aiService

      const result = await sut.getUsage()

      expect((result as { data: AIUsageResponse }).data.tier).toBe('pro')
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      mockApi.get.mockResolvedValue(errorResponse)
      const sut = aiService

      const result = await sut.getUsage()

      expect(result).toEqual(errorResponse)
    })

    it('handles network errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'))
      const sut = aiService

      await expect(sut.getUsage()).rejects.toThrow('Network error')
    })
  })
})
