import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AIRepository, UsageInfo } from './ai.repository'
import { CheckUsageLimitUseCase } from './check-usage-limit.usecase'

function createMockRepository(): { getUsageInfo: ReturnType<typeof vi.fn> } {
  return {
    getUsageInfo: vi.fn(),
  }
}

function createMockUsageInfo(overrides: Partial<UsageInfo> = {}): UsageInfo {
  return {
    tier: 'free',
    text: { used: 5, limit: 30, remaining: 25 },
    voice: { used: 1, limit: 5, remaining: 4 },
    image: { used: 0, limit: 5, remaining: 5 },
    used: 6,
    limit: 40,
    remainingRequests: 34,
    ...overrides,
  }
}

describe('CheckUsageLimitUseCase', () => {
  let sut: CheckUsageLimitUseCase
  let mockRepository: ReturnType<typeof createMockRepository>

  const userId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = createMockRepository()
    sut = new CheckUsageLimitUseCase(mockRepository as unknown as AIRepository)
  })

  describe('text requests', () => {
    it('allows when text remaining > 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          text: { used: 5, limit: 30, remaining: 25 },
        })
      )

      const result = await sut.execute(userId, 'text')

      expect(result.allowed).toBe(true)
      expect(result.requestType).toBe('text')
      expect(result.usageInfo.text.remaining).toBe(25)
    })

    it('denies when text remaining = 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          text: { used: 30, limit: 30, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'text')

      expect(result.allowed).toBe(false)
      expect(result.requestType).toBe('text')
      expect(result.usageInfo.text.remaining).toBe(0)
    })

    it('denies when text limit exceeded', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          text: { used: 35, limit: 30, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'text')

      expect(result.allowed).toBe(false)
    })
  })

  describe('voice requests', () => {
    it('allows when voice remaining > 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          voice: { used: 2, limit: 5, remaining: 3 },
        })
      )

      const result = await sut.execute(userId, 'voice')

      expect(result.allowed).toBe(true)
      expect(result.requestType).toBe('voice')
      expect(result.usageInfo.voice.remaining).toBe(3)
    })

    it('denies when voice remaining = 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          voice: { used: 5, limit: 5, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'voice')

      expect(result.allowed).toBe(false)
      expect(result.requestType).toBe('voice')
    })
  })

  describe('image requests', () => {
    it('allows when image remaining > 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          image: { used: 3, limit: 5, remaining: 2 },
        })
      )

      const result = await sut.execute(userId, 'image')

      expect(result.allowed).toBe(true)
      expect(result.requestType).toBe('image')
      expect(result.usageInfo.image.remaining).toBe(2)
    })

    it('denies when image remaining = 0', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          image: { used: 5, limit: 5, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'image')

      expect(result.allowed).toBe(false)
      expect(result.requestType).toBe('image')
    })
  })

  describe('unlimited tier', () => {
    it('always allows text requests', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          tier: 'unlimited',
          text: { used: 1000, limit: 30, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'text')

      expect(result.allowed).toBe(true)
    })

    it('always allows voice requests', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          tier: 'unlimited',
          voice: { used: 100, limit: 5, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'voice')

      expect(result.allowed).toBe(true)
    })

    it('always allows image requests', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          tier: 'unlimited',
          image: { used: 100, limit: 5, remaining: 0 },
        })
      )

      const result = await sut.execute(userId, 'image')

      expect(result.allowed).toBe(true)
    })
  })

  describe('pro tier', () => {
    it('applies pro tier limits correctly', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          tier: 'pro',
          text: { used: 100, limit: 150, remaining: 50 },
          voice: { used: 20, limit: 25, remaining: 5 },
          image: { used: 25, limit: 25, remaining: 0 },
        })
      )

      const textResult = await sut.execute(userId, 'text')
      expect(textResult.allowed).toBe(true)

      const voiceResult = await sut.execute(userId, 'voice')
      expect(voiceResult.allowed).toBe(true)

      const imageResult = await sut.execute(userId, 'image')
      expect(imageResult.allowed).toBe(false)
    })
  })

  describe('default request type', () => {
    it('defaults to text when no request type provided', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(createMockUsageInfo())

      const result = await sut.execute(userId)

      expect(result.requestType).toBe('text')
    })
  })

  describe('usage info passthrough', () => {
    it('returns full usage info in result', async () => {
      const usageInfo = createMockUsageInfo({
        tier: 'free',
        text: { used: 10, limit: 30, remaining: 20 },
        voice: { used: 2, limit: 5, remaining: 3 },
        image: { used: 1, limit: 5, remaining: 4 },
        used: 13,
        limit: 40,
        remainingRequests: 27,
      })
      mockRepository.getUsageInfo.mockResolvedValue(usageInfo)

      const result = await sut.execute(userId, 'text')

      expect(result.usageInfo).toEqual(usageInfo)
    })
  })

  describe('edge cases', () => {
    it('handles exactly 1 remaining request', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          text: { used: 29, limit: 30, remaining: 1 },
        })
      )

      const result = await sut.execute(userId, 'text')

      expect(result.allowed).toBe(true)
    })

    it('handles fresh account with no usage', async () => {
      mockRepository.getUsageInfo.mockResolvedValue(
        createMockUsageInfo({
          text: { used: 0, limit: 30, remaining: 30 },
          voice: { used: 0, limit: 5, remaining: 5 },
          image: { used: 0, limit: 5, remaining: 5 },
          used: 0,
          remainingRequests: 40,
        })
      )

      const textResult = await sut.execute(userId, 'text')
      expect(textResult.allowed).toBe(true)

      const voiceResult = await sut.execute(userId, 'voice')
      expect(voiceResult.allowed).toBe(true)

      const imageResult = await sut.execute(userId, 'image')
      expect(imageResult.allowed).toBe(true)
    })
  })
})
