import type { SupabaseClient } from '@supabase/supabase-js'

export interface AIUsage {
  id: string
  user_id: string
  request_type: 'text' | 'voice' | 'image'
  action_type: string | null
  tokens_used: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: 'free' | 'pro' | 'unlimited'
  ai_requests_limit: number
  ai_text_limit: number
  ai_voice_limit: number
  ai_image_limit: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface TypeUsage {
  used: number
  limit: number
  remaining: number
}

export interface UsageInfo {
  tier: Subscription['tier']
  text: TypeUsage
  voice: TypeUsage
  image: TypeUsage
  // Legacy fields for backwards compatibility
  used: number
  limit: number
  remainingRequests: number
}

export interface CachedResponse {
  id: string
  user_id: string
  cache_key: string
  request_type: 'text' | 'voice' | 'image'
  response_message: string
  response_action: {
    type: 'expense_created' | 'query_result' | 'forecast_result' | 'help'
    data?: unknown
  } | null
  tokens_saved: number
  created_at: string
  expires_at: string
}

export class AIRepository {
  constructor(private supabase: SupabaseClient) {}

  private getWeekBoundaries(): { startOfWeek: string; endOfWeek: string } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    // Adjust to Monday as start of week (Sunday = 0, so Monday = 1)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - daysToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return {
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
    }
  }

  async getSubscription(userId: string): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscription')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Subscription should be auto-created by database trigger on user signup
      // Return a default free tier if somehow missing (weekly limits)
      return {
        id: '',
        user_id: userId,
        tier: 'free',
        ai_requests_limit: 40,
        ai_text_limit: 30,
        ai_voice_limit: 5,
        ai_image_limit: 5,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return data as Subscription
  }

  async getWeeklyUsageCount(userId: string): Promise<number> {
    const { startOfWeek, endOfWeek } = this.getWeekBoundaries()

    const { count, error } = await this.supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfWeek)
      .lte('created_at', endOfWeek)

    if (error) return 0

    return count ?? 0
  }

  async getWeeklyUsageCountByType(
    userId: string
  ): Promise<{ text: number; voice: number; image: number }> {
    const { startOfWeek, endOfWeek } = this.getWeekBoundaries()

    const { data, error } = await this.supabase
      .from('ai_usage')
      .select('request_type')
      .eq('user_id', userId)
      .gte('created_at', startOfWeek)
      .lte('created_at', endOfWeek)

    if (error || !data) {
      return { text: 0, voice: 0, image: 0 }
    }

    const counts = { text: 0, voice: 0, image: 0 }
    for (const row of data) {
      const type = row.request_type as 'text' | 'voice' | 'image'
      if (type in counts) {
        counts[type]++
      }
    }

    return counts
  }

  async getUsageInfo(userId: string): Promise<UsageInfo> {
    const [subscription, usageByType] = await Promise.all([
      this.getSubscription(userId),
      this.getWeeklyUsageCountByType(userId),
    ])

    const totalUsed = usageByType.text + usageByType.voice + usageByType.image

    return {
      tier: subscription.tier,
      text: {
        used: usageByType.text,
        limit: subscription.ai_text_limit,
        remaining: Math.max(0, subscription.ai_text_limit - usageByType.text),
      },
      voice: {
        used: usageByType.voice,
        limit: subscription.ai_voice_limit,
        remaining: Math.max(0, subscription.ai_voice_limit - usageByType.voice),
      },
      image: {
        used: usageByType.image,
        limit: subscription.ai_image_limit,
        remaining: Math.max(0, subscription.ai_image_limit - usageByType.image),
      },
      // Legacy fields for backwards compatibility
      used: totalUsed,
      limit: subscription.ai_requests_limit,
      remainingRequests: Math.max(0, subscription.ai_requests_limit - totalUsed),
    }
  }

  async logUsage(
    userId: string,
    requestType: AIUsage['request_type'],
    actionType: string | null,
    tokensUsed: number
  ): Promise<AIUsage | null> {
    const { data, error } = await this.supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        request_type: requestType,
        action_type: actionType,
        tokens_used: tokensUsed,
      })
      .select('*')
      .single()

    if (error || !data) return null

    return data as AIUsage
  }

  // Response caching methods

  generateCacheKey(messageContent: string): string {
    // Normalize the message: lowercase, trim, remove extra whitespace
    const normalized = messageContent.toLowerCase().trim().replace(/\s+/g, ' ')
    // Include today's date to avoid stale expense data
    const dateKey = new Date().toISOString().slice(0, 10)
    // Simple hash using string manipulation (good enough for cache keys)
    let hash = 0
    const str = `${normalized}:${dateKey}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `${Math.abs(hash).toString(36)}_${dateKey}`
  }

  async getCachedResponse(userId: string, cacheKey: string): Promise<CachedResponse | null> {
    const { data, error } = await this.supabase
      .from('ai_response_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) return null

    return data as CachedResponse
  }

  async setCachedResponse(
    userId: string,
    cacheKey: string,
    requestType: 'text' | 'voice' | 'image',
    responseMessage: string,
    responseAction: CachedResponse['response_action'],
    tokensSaved: number
  ): Promise<void> {
    // Don't cache expense creation responses (side effects)
    if (responseAction?.type === 'expense_created') {
      return
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour TTL

    await this.supabase.from('ai_response_cache').upsert(
      {
        user_id: userId,
        cache_key: cacheKey,
        request_type: requestType,
        response_message: responseMessage,
        response_action: responseAction,
        tokens_saved: tokensSaved,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'user_id,cache_key',
      }
    )
  }

  async clearUserCache(userId: string): Promise<void> {
    await this.supabase.from('ai_response_cache').delete().eq('user_id', userId)
  }
}
