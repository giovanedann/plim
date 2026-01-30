import { describe, expect, it } from 'vitest'
import {
  effectiveSpendingLimitSchema,
  spendingLimitSchema,
  upsertSpendingLimitSchema,
} from './spending-limit'

describe('spendingLimitSchema', () => {
  const sut = spendingLimitSchema

  const validSpendingLimit = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    year_month: '2024-01',
    amount_cents: 500000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('accepts valid spending limit', () => {
    const result = sut.safeParse(validSpendingLimit)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validSpendingLimit)
  })

  it('accepts spending limit with minimum positive amount', () => {
    const limit = { ...validSpendingLimit, amount_cents: 1 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
  })

  it('rejects spending limit with zero amount', () => {
    const limit = { ...validSpendingLimit, amount_cents: 0 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with negative amount', () => {
    const limit = { ...validSpendingLimit, amount_cents: -1000 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with non-integer amount', () => {
    const limit = { ...validSpendingLimit, amount_cents: 500.5 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with invalid id', () => {
    const limit = { ...validSpendingLimit, id: 'invalid-uuid' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with invalid user_id', () => {
    const limit = { ...validSpendingLimit, user_id: 'invalid-uuid' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with invalid year_month format (DD-MM)', () => {
    const limit = { ...validSpendingLimit, year_month: '01-2024' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Month must be in YYYY-MM format')
  })

  it('rejects spending limit with full date year_month', () => {
    const limit = { ...validSpendingLimit, year_month: '2024-01-15' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Month must be in YYYY-MM format')
  })

  it('rejects spending limit with single digit month', () => {
    const limit = { ...validSpendingLimit, year_month: '2024-1' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Month must be in YYYY-MM format')
  })

  it('rejects spending limit with invalid created_at format', () => {
    const limit = { ...validSpendingLimit, created_at: '2024-01-01' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects spending limit with invalid updated_at format', () => {
    const limit = { ...validSpendingLimit, updated_at: '2024-01-01' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('accepts year_month at year boundary', () => {
    const limit = { ...validSpendingLimit, year_month: '2024-12' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
  })
})

describe('upsertSpendingLimitSchema', () => {
  const sut = upsertSpendingLimitSchema

  it('accepts valid upsert input', () => {
    const input = {
      year_month: '2024-02',
      amount_cents: 750000,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(input)
  })

  it('accepts minimum positive amount', () => {
    const input = {
      year_month: '2024-01',
      amount_cents: 1,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('rejects zero amount', () => {
    const input = {
      year_month: '2024-01',
      amount_cents: 0,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const input = {
      year_month: '2024-01',
      amount_cents: -100,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input without year_month', () => {
    const input = {
      amount_cents: 500000,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input without amount_cents', () => {
    const input = {
      year_month: '2024-01',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects invalid year_month format', () => {
    const input = {
      year_month: '2024/01',
      amount_cents: 500000,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Month must be in YYYY-MM format')
  })

  it('rejects non-integer amount', () => {
    const input = {
      year_month: '2024-01',
      amount_cents: 500.99,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('strips extra fields', () => {
    const input = {
      year_month: '2024-01',
      amount_cents: 500000,
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('id')
    expect(result.data).not.toHaveProperty('user_id')
  })
})

describe('effectiveSpendingLimitSchema', () => {
  const sut = effectiveSpendingLimitSchema

  const validEffectiveLimit = {
    year_month: '2024-02',
    amount_cents: 500000,
    is_carried_over: false,
    source_month: null,
  }

  it('accepts valid effective spending limit without carry-over', () => {
    const result = sut.safeParse(validEffectiveLimit)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validEffectiveLimit)
  })

  it('accepts effective limit with carry-over', () => {
    const limit = {
      year_month: '2024-03',
      amount_cents: 500000,
      is_carried_over: true,
      source_month: '2024-01',
    }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
    expect(result.data?.is_carried_over).toBe(true)
    expect(result.data?.source_month).toBe('2024-01')
  })

  it('accepts minimum positive amount', () => {
    const limit = { ...validEffectiveLimit, amount_cents: 1 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
  })

  it('rejects zero amount', () => {
    const limit = { ...validEffectiveLimit, amount_cents: 0 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const limit = { ...validEffectiveLimit, amount_cents: -1000 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects non-integer amount', () => {
    const limit = { ...validEffectiveLimit, amount_cents: 500.5 }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects invalid year_month format', () => {
    const limit = { ...validEffectiveLimit, year_month: '01-2024' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects invalid source_month format when provided', () => {
    const limit = {
      ...validEffectiveLimit,
      is_carried_over: true,
      source_month: '2024/01',
    }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('accepts null source_month', () => {
    const limit = { ...validEffectiveLimit, source_month: null }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
    expect(result.data?.source_month).toBeNull()
  })

  it('rejects missing is_carried_over', () => {
    const { is_carried_over: _, ...limit } = validEffectiveLimit

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('rejects invalid is_carried_over type', () => {
    const limit = { ...validEffectiveLimit, is_carried_over: 'yes' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(false)
  })

  it('accepts year_month at year boundary', () => {
    const limit = { ...validEffectiveLimit, year_month: '2024-12' }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
  })

  it('accepts source_month at year boundary', () => {
    const limit = {
      ...validEffectiveLimit,
      is_carried_over: true,
      source_month: '2023-12',
    }

    const result = sut.safeParse(limit)

    expect(result.success).toBe(true)
  })
})
