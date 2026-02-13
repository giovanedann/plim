import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmbeddingOutput } from './ai-client.types'
import { GeminiClient } from './gemini-client'

const mockEmbedContent = vi.fn()
const mockGenerateContent = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
  },
}))

describe('GeminiClient', () => {
  let sut: GeminiClient

  beforeEach(() => {
    vi.clearAllMocks()
    const mockGenAI = {
      models: {
        embedContent: mockEmbedContent,
        generateContent: mockGenerateContent,
      },
    }
    sut = new GeminiClient(mockGenAI as never)
  })

  describe('generateEmbedding', () => {
    it('returns embedding array from API response', async () => {
      const fakeEmbedding = Array(768).fill(0.1)
      mockEmbedContent.mockResolvedValue({
        embeddings: [{ values: fakeEmbedding }],
      })

      const result: EmbeddingOutput = await sut.generateEmbedding('quanto gastei esse mes')

      expect(result.embedding).toEqual(fakeEmbedding)
      expect(result.embedding).toHaveLength(768)
    })

    it('calls embedContent with model, contents, and outputDimensionality', async () => {
      mockEmbedContent.mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2] }],
      })

      await sut.generateEmbedding('teste de embedding')

      expect(mockEmbedContent).toHaveBeenCalledWith({
        model: 'gemini-embedding-001',
        contents: 'teste de embedding',
        config: { outputDimensionality: 768 },
      })
    })

    it('throws when embedding response is missing values', async () => {
      mockEmbedContent.mockResolvedValue({ embeddings: [] })

      await expect(sut.generateEmbedding('test')).rejects.toThrow(
        'Embedding response missing values'
      )
    })

    it('propagates errors from the API', async () => {
      mockEmbedContent.mockRejectedValue(new Error('API quota exceeded'))

      await expect(sut.generateEmbedding('test')).rejects.toThrow('API quota exceeded')
    })
  })

  describe('chat', () => {
    it('returns text response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello!',
        functionCalls: undefined,
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      })

      const result = await sut.chat({
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
      })

      expect(result.text).toBe('Hello!')
      expect(result.functionCall).toBeNull()
      expect(result.tokensUsed).toBe(15)
      expect(result.inputTokens).toBe(10)
      expect(result.outputTokens).toBe(5)
    })

    it('returns function call response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: undefined,
        functionCalls: [{ name: 'create_expense', args: { amount: 100 } }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      })

      const result = await sut.chat({
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Almoço R$35' }] }],
      })

      expect(result.functionCall).toEqual({ name: 'create_expense', args: { amount: 100 } })
      expect(result.text).toBeNull()
    })

    it('passes system prompt and tools in config', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'OK',
        functionCalls: undefined,
        usageMetadata: {},
      })

      await sut.chat({
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
        systemPrompt: 'You are a helper',
        functions: [
          {
            name: 'test_fn',
            description: 'A test function',
            parameters: { type: 'object', properties: { x: { type: 'string' } } },
          },
        ],
      })

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          config: expect.objectContaining({
            systemInstruction: 'You are a helper',
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'test_fn',
                    description: 'A test function',
                    parameters: {
                      type: 'OBJECT',
                      properties: { x: { type: 'STRING' } },
                    },
                  },
                ],
              },
            ],
          }),
        })
      )
    })
  })
})
