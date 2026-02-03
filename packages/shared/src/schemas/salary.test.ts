import { describe, expect, it } from 'vitest'
import { createSalarySchema, salaryHistorySchema, salaryQuerySchema } from './salary'

describe('salaryHistorySchema', () => {
  const sut = salaryHistorySchema

  const validSalaryHistory = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    amount_cents: 500000,
    effective_from: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
  }

  it('accepts valid salary history', () => {
    const result = sut.safeParse(validSalaryHistory)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validSalaryHistory)
    }
  })

  it('accepts salary with zero amount', () => {
    const salary = { ...validSalaryHistory, amount_cents: 0 }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(true)
  })

  it('accepts salary with large amount', () => {
    const salary = { ...validSalaryHistory, amount_cents: 999999999 }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(true)
  })

  it('rejects salary with negative amount', () => {
    const salary = { ...validSalaryHistory, amount_cents: -1000 }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Valor não pode ser negativo')
    }
  })

  it('rejects salary with non-integer amount', () => {
    const salary = { ...validSalaryHistory, amount_cents: 5000.5 }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
  })

  it('rejects salary with invalid id', () => {
    const salary = { ...validSalaryHistory, id: 'invalid-uuid' }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
  })

  it('rejects salary with invalid user_id', () => {
    const salary = { ...validSalaryHistory, user_id: 'invalid-uuid' }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
  })

  it('rejects salary with invalid effective_from format', () => {
    const salary = { ...validSalaryHistory, effective_from: '01-01-2024' }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
  })

  it('rejects salary with invalid created_at format', () => {
    const salary = { ...validSalaryHistory, created_at: '2024-01-01' }

    const result = sut.safeParse(salary)

    expect(result.success).toBe(false)
  })
})

describe('createSalarySchema', () => {
  const sut = createSalarySchema

  const validInput = {
    amount_cents: 750000,
    effective_from: '2024-02-01',
  }

  it('accepts valid create input', () => {
    const result = sut.safeParse(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('accepts zero amount', () => {
    const input = { ...validInput, amount_cents: 0 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('accepts maximum reasonable amount', () => {
    const input = { ...validInput, amount_cents: 999999999 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('rejects negative amount', () => {
    const input = { ...validInput, amount_cents: -100 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Valor não pode ser negativo')
    }
  })

  it('rejects input without amount_cents', () => {
    const input = { effective_from: '2024-02-01' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input without effective_from', () => {
    const input = { amount_cents: 500000 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input with invalid date format', () => {
    const input = { ...validInput, effective_from: '2024/02/01' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input with non-integer amount', () => {
    const input = { ...validInput, amount_cents: 500.99 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('strips extra fields (id, user_id)', () => {
    const input = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      amount_cents: 500000,
      effective_from: '2024-02-01',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('id')
      expect(result.data).not.toHaveProperty('user_id')
    }
  })
})

describe('salaryQuerySchema', () => {
  const sut = salaryQuerySchema

  it('accepts valid month format YYYY-MM', () => {
    const result = sut.safeParse({ month: '2024-01' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ month: '2024-01' })
    }
  })

  it('accepts month at year boundary (December)', () => {
    const result = sut.safeParse({ month: '2024-12' })

    expect(result.success).toBe(true)
  })

  it('accepts month at beginning of year (January)', () => {
    const result = sut.safeParse({ month: '2024-01' })

    expect(result.success).toBe(true)
  })

  it('rejects month with invalid format (MM-YYYY)', () => {
    const result = sut.safeParse({ month: '01-2024' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Mês deve estar no formato AAAA-MM')
    }
  })

  it('rejects month with full date (YYYY-MM-DD)', () => {
    const result = sut.safeParse({ month: '2024-01-15' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Mês deve estar no formato AAAA-MM')
    }
  })

  it('rejects month with single digit month', () => {
    const result = sut.safeParse({ month: '2024-1' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Mês deve estar no formato AAAA-MM')
    }
  })

  it('rejects month without hyphen', () => {
    const result = sut.safeParse({ month: '202401' })

    expect(result.success).toBe(false)
  })

  it('rejects query without month', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(false)
  })
})
