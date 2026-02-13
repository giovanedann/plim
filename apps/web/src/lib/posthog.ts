import posthog from 'posthog-js'

let initialized = false

export function initPostHog(): void {
  if (initialized) return

  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST

  if (!key || !host) return

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    opt_out_capturing_by_default: true,
    disable_surveys: false,
    persistence: 'localStorage',
  })

  initialized = true
}

export function getPostHog(): typeof posthog | null {
  if (!initialized) return null
  return posthog
}
