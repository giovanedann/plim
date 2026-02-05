import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AIRepository,
  type CachedResponse,
  type IntentCacheEntry,
  type Subscription,
} from './ai.repository'

type MockSupabaseQuery = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  gt: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function createMockSupabaseQuery(): MockSupabaseQuery {
  const query: MockSupabaseQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
  return query
}

function createMockSupabase(query: MockSupabaseQuery) {
  return {
    from: vi.fn().mockReturnValue(query),
    rpc: vi.fn(),
  }
}

describe('AIRepository', () => {
  let sut: AIRepository
  let mockQuery: MockSupabaseQuery
  let mockSupabase: ReturnType<typeof createMockSupabase>

  const userId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

    mockQuery = createMockSupabaseQuery()
    mockSupabase = createMockSupabase(mockQuery)
    sut = new AIRepository(mockSupabase as never)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getSubscription', () => {
    it('returns subscription data when found', async () => {
      const subscription: Subscription = {
        id: 'sub-1',
        user_id: userId,
        tier: 'pro',
        ai_requests_limit: 200,
        ai_text_limit: 150,
        ai_voice_limit: 25,
        ai_image_limit: 25,
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_start: '2026-01-01T00:00:00.000Z',
        current_period_end: '2026-02-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }
      mockQuery.single.mockResolvedValue({ data: subscription, error: null })

      const result = await sut.getSubscription(userId)

      expect(result).toEqual(subscription)
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription')
    })

    it('returns default free tier when subscription not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const result = await sut.getSubscription(userId)

      expect(result.tier).toBe('free')
      expect(result.ai_requests_limit).toBe(20)
      expect(result.ai_text_limit).toBe(15)
      expect(result.ai_voice_limit).toBe(2)
      expect(result.ai_image_limit).toBe(3)
    })
  })

  describe('getWeeklyUsageCount', () => {
    it('returns total count for the current week', async () => {
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ count: 15, error: null }),
          }),
        }),
      })

      const result = await sut.getWeeklyUsageCount(userId)

      expect(result).toBe(15)
    })

    it('returns 0 when error occurs', async () => {
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
          }),
        }),
      })

      const result = await sut.getWeeklyUsageCount(userId)

      expect(result).toBe(0)
    })
  })

  describe('getWeeklyUsageCountByType', () => {
    it('returns breakdown by text/voice/image', async () => {
      const usageData = [
        { request_type: 'text' },
        { request_type: 'text' },
        { request_type: 'text' },
        { request_type: 'voice' },
        { request_type: 'image' },
        { request_type: 'image' },
      ]
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: usageData, error: null }),
          }),
        }),
      })

      const result = await sut.getWeeklyUsageCountByType(userId)

      expect(result).toEqual({ text: 3, voice: 1, image: 2 })
    })

    it('returns zeros when no data', async () => {
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const result = await sut.getWeeklyUsageCountByType(userId)

      expect(result).toEqual({ text: 0, voice: 0, image: 0 })
    })

    it('returns zeros when error occurs', async () => {
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      })

      const result = await sut.getWeeklyUsageCountByType(userId)

      expect(result).toEqual({ text: 0, voice: 0, image: 0 })
    })
  })

  describe('getUsageInfo', () => {
    it('returns combined subscription and usage data', async () => {
      const subscription: Subscription = {
        id: 'sub-1',
        user_id: userId,
        tier: 'free',
        ai_requests_limit: 20,
        ai_text_limit: 15,
        ai_voice_limit: 2,
        ai_image_limit: 3,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }

      const usageData = [
        { request_type: 'text' },
        { request_type: 'text' },
        { request_type: 'voice' },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'subscription') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: subscription, error: null }),
              }),
            }),
          }
        }
        if (table === 'ai_usage') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: usageData, error: null }),
                }),
              }),
            }),
          }
        }
        return mockQuery
      })

      const result = await sut.getUsageInfo(userId)

      expect(result.tier).toBe('free')
      expect(result.text).toEqual({ used: 2, limit: 15, remaining: 13 })
      expect(result.voice).toEqual({ used: 1, limit: 2, remaining: 1 })
      expect(result.image).toEqual({ used: 0, limit: 3, remaining: 3 })
      expect(result.used).toBe(3)
      expect(result.remainingRequests).toBe(17)
    })
  })

  describe('logUsage', () => {
    it('logs usage with correct request type and action', async () => {
      const insertedUsage = {
        id: 'usage-1',
        user_id: userId,
        request_type: 'text',
        action_type: 'create_expense',
        tokens_used: 150,
        created_at: '2026-01-15T12:00:00.000Z',
      }
      mockQuery.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: insertedUsage, error: null }),
        }),
      })

      const result = await sut.logUsage(userId, 'text', 'create_expense', 150)

      expect(result).toEqual(insertedUsage)
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        request_type: 'text',
        action_type: 'create_expense',
        tokens_used: 150,
      })
    })

    it('returns null when insert fails', async () => {
      mockQuery.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      })

      const result = await sut.logUsage(userId, 'voice', 'chat', 100)

      expect(result).toBeNull()
    })
  })

  describe('generateCacheKey', () => {
    it('normalizes content and includes date', () => {
      const key1 = sut.generateCacheKey('Hello World')
      const key2 = sut.generateCacheKey('  hello   world  ')

      expect(key1).toBe(key2)
      expect(key1).toContain('2026-01-15')
    })

    it('generates different keys for different messages', () => {
      const key1 = sut.generateCacheKey('How much did I spend?')
      const key2 = sut.generateCacheKey('Create an expense')

      expect(key1).not.toBe(key2)
    })

    it('generates different keys for different dates', () => {
      const key1 = sut.generateCacheKey('Hello')

      vi.setSystemTime(new Date('2026-01-16T12:00:00.000Z'))
      const key2 = sut.generateCacheKey('Hello')

      expect(key1).not.toBe(key2)
    })
  })

  describe('getCachedResponse', () => {
    it('returns cached response when valid', async () => {
      const cached: CachedResponse = {
        id: 'cache-1',
        user_id: userId,
        cache_key: 'abc123_2026-01-15',
        request_type: 'text',
        response_message: 'Cached response',
        response_action: { type: 'query_result', data: { total: 1000 } },
        tokens_saved: 150,
        created_at: '2026-01-15T11:00:00.000Z',
        expires_at: '2026-01-15T13:00:00.000Z',
      }
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: cached, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.getCachedResponse(userId, 'abc123_2026-01-15')

      expect(result).toEqual(cached)
    })

    it('returns null when expired or not found', async () => {
      mockQuery.select.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.getCachedResponse(userId, 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('setCachedResponse', () => {
    it('stores response with TTL', async () => {
      mockQuery.upsert.mockResolvedValue({ error: null })

      await sut.setCachedResponse(
        userId,
        'abc123_2026-01-15',
        'text',
        'Response message',
        { type: 'query_result', data: { total: 1000 } },
        150
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_response_cache')
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          cache_key: 'abc123_2026-01-15',
          request_type: 'text',
          response_message: 'Response message',
          response_action: { type: 'query_result', data: { total: 1000 } },
          tokens_saved: 150,
        }),
        { onConflict: 'user_id,cache_key' }
      )
    })

    it('skips caching for expense_created action', async () => {
      await sut.setCachedResponse(
        userId,
        'abc123_2026-01-15',
        'text',
        'Expense created',
        { type: 'expense_created', data: { id: 'exp-1' } },
        150
      )

      expect(mockQuery.upsert).not.toHaveBeenCalled()
    })

    it('caches query_result responses', async () => {
      mockQuery.upsert.mockResolvedValue({ error: null })

      await sut.setCachedResponse(
        userId,
        'abc123_2026-01-15',
        'text',
        'Query result',
        { type: 'query_result', data: {} },
        100
      )

      expect(mockQuery.upsert).toHaveBeenCalled()
    })

    it('caches forecast_result responses', async () => {
      mockQuery.upsert.mockResolvedValue({ error: null })

      await sut.setCachedResponse(
        userId,
        'abc123_2026-01-15',
        'text',
        'Forecast result',
        { type: 'forecast_result', data: {} },
        100
      )

      expect(mockQuery.upsert).toHaveBeenCalled()
    })

    it('caches responses with null action', async () => {
      mockQuery.upsert.mockResolvedValue({ error: null })

      await sut.setCachedResponse(userId, 'abc123_2026-01-15', 'text', 'Plain response', null, 100)

      expect(mockQuery.upsert).toHaveBeenCalled()
    })
  })

  describe('clearUserCache', () => {
    it('deletes all cache entries for user', async () => {
      mockQuery.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
      })

      await sut.clearUserCache(userId)

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_response_cache')
    })

    it('logs when cache entries are cleared', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      mockQuery.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 5 }),
      })

      await sut.clearUserCache(userId)

      expect(consoleSpy).toHaveBeenCalledWith('[AI Cache] Invalidated cache for user', {
        userId,
        entriesCleared: 5,
      })
      consoleSpy.mockRestore()
    })

    it('does not log when no entries are cleared', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      mockQuery.delete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
      })

      await sut.clearUserCache(userId)

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('findSimilarIntent', () => {
    const testEmbedding = Array(768).fill(0.1)

    it('returns cached intent when similarity meets threshold', async () => {
      const cachedIntent: IntentCacheEntry = {
        id: 'intent-1',
        canonical_text: 'quanto gastei esse mes',
        function_name: 'query_expenses',
        params_template: { period: 'current_month' },
        extraction_hints: null,
        usage_count: 5,
        similarity: 0.95,
      }
      mockSupabase.rpc.mockResolvedValue({ data: [cachedIntent], error: null })

      const result = await sut.findSimilarIntent(testEmbedding)

      expect(result).toEqual(cachedIntent)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('find_similar_intent', {
        query_embedding: JSON.stringify(testEmbedding),
        similarity_threshold: 0.92,
        max_results: 1,
      })
    })

    it('returns null when no match found', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await sut.findSimilarIntent(testEmbedding)

      expect(result).toBeNull()
    })

    it('returns null when RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } })

      const result = await sut.findSimilarIntent(testEmbedding)

      expect(result).toBeNull()
    })

    it('uses custom threshold when provided', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await sut.findSimilarIntent(testEmbedding, 0.85)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('find_similar_intent', {
        query_embedding: JSON.stringify(testEmbedding),
        similarity_threshold: 0.85,
        max_results: 1,
      })
    })
  })

  describe('storeIntent', () => {
    it('inserts intent with serialized embedding', async () => {
      mockQuery.insert.mockResolvedValue({ error: null })
      const embedding = [0.1, 0.2, 0.3]

      await sut.storeIntent({
        canonical_text: 'quanto gastei esse mes',
        embedding,
        function_name: 'query_expenses',
        params_template: { period: 'current_month' },
        extraction_hints: 'Dynamic params to extract: start_date, end_date',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('intent_cache')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        canonical_text: 'quanto gastei esse mes',
        embedding: JSON.stringify(embedding),
        function_name: 'query_expenses',
        params_template: { period: 'current_month' },
        extraction_hints: 'Dynamic params to extract: start_date, end_date',
      })
    })

    it('inserts intent with null extraction hints', async () => {
      mockQuery.insert.mockResolvedValue({ error: null })

      await sut.storeIntent({
        canonical_text: 'quais meus cartoes',
        embedding: [0.1],
        function_name: 'execute_query',
        params_template: { entity: 'credit_cards' },
        extraction_hints: null,
      })

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ extraction_hints: null })
      )
    })
  })
})
