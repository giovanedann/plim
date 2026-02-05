import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmbeddingOutput } from './ai-client.types'
import { GeminiClient } from './gemini-client'

const mockEmbedContent = vi.fn()
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn()

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: (...args: unknown[]) => mockGetGenerativeModel(...args),
  })),
  SchemaType: {
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
    mockGetGenerativeModel.mockReturnValue({
      embedContent: mockEmbedContent,
      generateContent: mockGenerateContent,
    })
    sut = new GeminiClient('test-api-key')
  })

  describe('generateEmbedding', () => {
    it('returns embedding array from API response', async () => {
      const fakeEmbedding = Array(768).fill(0.1)
      mockEmbedContent.mockResolvedValue({
        embedding: { values: fakeEmbedding },
      })

      const result: EmbeddingOutput = await sut.generateEmbedding('quanto gastei esse mes')

      expect(result.embedding).toEqual(fakeEmbedding)
      expect(result.embedding).toHaveLength(768)
    })

    it('calls embedContent with the input text', async () => {
      mockEmbedContent.mockResolvedValue({
        embedding: { values: [0.1, 0.2] },
      })

      await sut.generateEmbedding('teste de embedding')

      expect(mockEmbedContent).toHaveBeenCalledWith('teste de embedding')
    })

    it('uses text-embedding-004 model', async () => {
      mockEmbedContent.mockResolvedValue({
        embedding: { values: [0.1] },
      })

      await sut.generateEmbedding('test')

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'text-embedding-004' })
    })

    it('propagates errors from the API', async () => {
      mockEmbedContent.mockRejectedValue(new Error('API quota exceeded'))

      await expect(sut.generateEmbedding('test')).rejects.toThrow('API quota exceeded')
    })
  })
})
