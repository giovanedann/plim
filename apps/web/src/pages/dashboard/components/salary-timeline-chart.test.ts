import { describe, expect, it } from 'vitest'
import { formatDate } from './salary-timeline-chart'

// Regression for the timezone month-shift bug: `new Date('2026-06-01')` parses as
// UTC midnight, and getMonth() read in a negative-offset timezone (TZ below)
// rolled 1st-of-month dates back a month. formatDate must be timezone-independent.
describe('formatDate', () => {
  it('keeps 1st-of-month dates in the correct month', () => {
    expect(formatDate('2026-06-01')).toBe('Jun 26')
    expect(formatDate('2026-05-01')).toBe('Mai 26')
    expect(formatDate('2025-12-01')).toBe('Dez 25')
  })

  it('formats mid-month dates', () => {
    expect(formatDate('2025-12-15')).toBe('Dez 25')
    expect(formatDate('2026-01-31')).toBe('Jan 26')
  })
})
