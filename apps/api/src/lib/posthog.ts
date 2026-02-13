import { PostHog } from 'posthog-node'
import type { Bindings } from './env'

export function createServerPostHog(env: Bindings): PostHog | null {
  if (!env.POSTHOG_API_KEY || !env.POSTHOG_HOST) {
    return null
  }

  return new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
}
