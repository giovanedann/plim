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
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface UsageInfo {
  used: number
  limit: number
  tier: Subscription['tier']
  remainingRequests: number
}

export class AIRepository {
  constructor(private supabase: SupabaseClient) {}

  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscription')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as Subscription
  }

  async createDefaultSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscription')
      .insert({
        user_id: userId,
        tier: 'free',
        ai_requests_limit: 30,
      })
      .select('*')
      .single()

    if (error || !data) return null

    return data as Subscription
  }

  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    const existing = await this.getSubscription(userId)
    if (existing) return existing

    const created = await this.createDefaultSubscription(userId)
    if (!created) {
      throw new Error('Failed to create subscription')
    }

    return created
  }

  async getMonthlyUsageCount(userId: string): Promise<number> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).toISOString()

    const { count, error } = await this.supabase
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    if (error) return 0

    return count ?? 0
  }

  async getUsageInfo(userId: string): Promise<UsageInfo> {
    const subscription = await this.getOrCreateSubscription(userId)
    const used = await this.getMonthlyUsageCount(userId)

    return {
      used,
      limit: subscription.ai_requests_limit,
      tier: subscription.tier,
      remainingRequests: Math.max(0, subscription.ai_requests_limit - used),
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
}
