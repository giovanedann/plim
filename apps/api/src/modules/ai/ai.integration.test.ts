import {
  type AIChatResponse,
  type AIUsageResponse,
  ERROR_CODES,
  HTTP_STATUS,
  createMockAIUsageResponse,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { AIDependencies } from './ai.factory'
import { createAIRouterWithDeps } from './ai.routes'

const mockGetUsageInfo = { execute: vi.fn() }
const mockCheckUsageLimit = { execute: vi.fn() }
const mockChat = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  aiClient: {},
  supabase: {},
  getUsageInfo: mockGetUsageInfo,
  checkUsageLimit: mockCheckUsageLimit,
  chat: mockChat,
} as unknown as AIDependencies

describe('AI Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createAIRouterWithDeps(mockDependencies)
    app.route('/ai', router)
  })

  describe('GET /ai/usage', () => {
    it('returns 200 with tiered usage breakdown', async () => {
      const usageInfo = createMockAIUsageResponse({
        tier: 'free',
        text: { used: 10, limit: 30, remaining: 20 },
        voice: { used: 2, limit: 5, remaining: 3 },
        image: { used: 1, limit: 5, remaining: 4 },
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/usage')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AIUsageResponse }
      expect(body.data.tier).toBe('free')
      expect(body.data.text).toEqual({ used: 10, limit: 30, remaining: 20 })
      expect(body.data.voice).toEqual({ used: 2, limit: 5, remaining: 3 })
      expect(body.data.image).toEqual({ used: 1, limit: 5, remaining: 4 })
      expect(mockGetUsageInfo.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns pro tier usage when user is pro', async () => {
      const usageInfo = createMockAIUsageResponse({
        tier: 'pro',
        text: { used: 50, limit: 150, remaining: 100 },
        voice: { used: 10, limit: 25, remaining: 15 },
        image: { used: 5, limit: 25, remaining: 20 },
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/usage')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AIUsageResponse }
      expect(body.data.tier).toBe('pro')
    })

    it('returns unlimited tier usage', async () => {
      const usageInfo = createMockAIUsageResponse({
        tier: 'unlimited',
        text: { used: 500, limit: 999999, remaining: 999499 },
        voice: { used: 100, limit: 999999, remaining: 999899 },
        image: { used: 50, limit: 999999, remaining: 999949 },
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/usage')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AIUsageResponse }
      expect(body.data.tier).toBe('unlimited')
    })
  })

  describe('POST /ai/chat', () => {
    it('detects text request type', async () => {
      const usageInfo = createMockAIUsageResponse()
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo,
        requestType: 'text',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Response',
        action: undefined,
        tokensUsed: 100,
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockCheckUsageLimit.execute).toHaveBeenCalledWith(TEST_USER_ID, 'text')
    })

    it('detects voice request type', async () => {
      const usageInfo = createMockAIUsageResponse()
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo,
        requestType: 'voice',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Response',
        action: undefined,
        tokensUsed: 100,
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ type: 'audio', data: 'base64data', mimeType: 'audio/webm' }],
            },
          ],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockCheckUsageLimit.execute).toHaveBeenCalledWith(TEST_USER_ID, 'voice')
    })

    it('detects image request type', async () => {
      const usageInfo = createMockAIUsageResponse()
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo,
        requestType: 'image',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Response',
        action: undefined,
        tokensUsed: 100,
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ type: 'image', data: 'base64data', mimeType: 'image/jpeg' }],
            },
          ],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockCheckUsageLimit.execute).toHaveBeenCalledWith(TEST_USER_ID, 'image')
    })

    it('returns 403 when text limit exceeded', async () => {
      const usageInfo = createMockAIUsageResponse({
        text: { used: 30, limit: 30, remaining: 0 },
      })
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: false,
        usageInfo,
        requestType: 'text',
      })

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      const body = (await res.json()) as { error: { code: string; message: string } }
      expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN)
      expect(body.error.message).toContain('texto')
    })

    it('returns 403 when voice limit exceeded', async () => {
      const usageInfo = createMockAIUsageResponse({
        voice: { used: 5, limit: 5, remaining: 0 },
      })
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: false,
        usageInfo,
        requestType: 'voice',
      })

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ type: 'audio', data: 'base64', mimeType: 'audio/webm' }] },
          ],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      const body = (await res.json()) as { error: { code: string; message: string } }
      expect(body.error.message).toContain('voz')
    })

    it('returns 403 when image limit exceeded', async () => {
      const usageInfo = createMockAIUsageResponse({
        image: { used: 5, limit: 5, remaining: 0 },
      })
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: false,
        usageInfo,
        requestType: 'image',
      })

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ type: 'image', data: 'base64', mimeType: 'image/jpeg' }] },
          ],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN)
      const body = (await res.json()) as { error: { code: string; message: string } }
      expect(body.error.message).toContain('imagem')
    })

    it('returns 200 with message, action, and usageInfo', async () => {
      const usageInfo = createMockAIUsageResponse()
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo,
        requestType: 'text',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Despesa criada: Almoço de R$35,00',
        action: { type: 'expense_created', data: { id: 'exp-1' } },
        tokensUsed: 150,
      })
      const updatedUsageInfo = createMockAIUsageResponse({
        text: { used: 6, limit: 30, remaining: 24 },
      })
      mockGetUsageInfo.execute.mockResolvedValue(updatedUsageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Almoço de R$35' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AIChatResponse }
      expect(body.data.message).toBe('Despesa criada: Almoço de R$35,00')
      expect(body.data.action).toEqual({ type: 'expense_created', data: { id: 'exp-1' } })
      expect(body.data.usageInfo.text.used).toBe(6)
    })

    it('returns 400 for invalid request body - missing messages', async () => {
      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid request body - empty messages array', async () => {
      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid request body - invalid role', async () => {
      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'invalid', content: [{ type: 'text', text: 'Hello' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid request body - empty content', async () => {
      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 400 for invalid content part type', async () => {
      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ type: 'invalid', text: 'Hello' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles chat with multiple messages in conversation', async () => {
      const usageInfo = createMockAIUsageResponse()
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo,
        requestType: 'text',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Your total is R$150,00',
        action: { type: 'query_result', data: { total: 15000 } },
        tokensUsed: 200,
      })
      mockGetUsageInfo.execute.mockResolvedValue(usageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ type: 'text', text: 'Quanto gastei esse mês?' }] },
            { role: 'assistant', content: [{ type: 'text', text: 'Em qual categoria?' }] },
            { role: 'user', content: [{ type: 'text', text: 'Alimentação' }] },
          ],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(mockChat.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
            expect.objectContaining({ role: 'assistant' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      )
    })

    it('returns updated usage info after chat', async () => {
      const initialUsageInfo = createMockAIUsageResponse({
        text: { used: 5, limit: 30, remaining: 25 },
      })
      mockCheckUsageLimit.execute.mockResolvedValue({
        allowed: true,
        usageInfo: initialUsageInfo,
        requestType: 'text',
      })
      mockChat.execute.mockResolvedValue({
        message: 'Response',
        tokensUsed: 100,
      })
      const updatedUsageInfo = createMockAIUsageResponse({
        text: { used: 6, limit: 30, remaining: 24 },
      })
      mockGetUsageInfo.execute.mockResolvedValue(updatedUsageInfo)

      const res = await app.request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AIChatResponse }
      expect(body.data.usageInfo.text.used).toBe(6)
      expect(body.data.usageInfo.text.remaining).toBe(24)
    })
  })
})
