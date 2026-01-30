import { describe, expect, it } from 'vitest'
import {
  cardBankSchema,
  cardColorSchema,
  cardFlagSchema,
  createCreditCardSchema,
  creditCardSchema,
  updateCreditCardSchema,
} from './credit-card'

describe('cardFlagSchema', () => {
  const sut = cardFlagSchema

  it.each([
    'visa',
    'mastercard',
    'elo',
    'american_express',
    'hipercard',
    'diners',
    'other',
  ] as const)('accepts valid card flag: %s', (flag) => {
    const result = sut.safeParse(flag)

    expect(result.success).toBe(true)
  })

  it('rejects invalid card flag', () => {
    const result = sut.safeParse('discover')

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Selecione uma bandeira válida')
  })
})

describe('cardBankSchema', () => {
  const sut = cardBankSchema

  it.each([
    'nubank',
    'inter',
    'c6_bank',
    'itau',
    'bradesco',
    'santander',
    'banco_do_brasil',
    'caixa',
    'original',
    'neon',
    'next',
    'picpay',
    'mercado_pago',
    'other',
  ] as const)('accepts valid bank: %s', (bank) => {
    const result = sut.safeParse(bank)

    expect(result.success).toBe(true)
  })

  it('rejects invalid bank', () => {
    const result = sut.safeParse('chase')

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Selecione um banco válido')
  })
})

describe('cardColorSchema', () => {
  const sut = cardColorSchema

  it.each([
    'black',
    'dark_blue',
    'yellow',
    'red',
    'orange',
    'light_purple',
    'neon_green',
    'neon_blue',
    'white',
    'silver',
    'gold',
    'rose_gold',
  ] as const)('accepts valid color: %s', (color) => {
    const result = sut.safeParse(color)

    expect(result.success).toBe(true)
  })

  it('rejects invalid color', () => {
    const result = sut.safeParse('pink')

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Selecione uma cor válida')
  })
})

describe('creditCardSchema', () => {
  const sut = creditCardSchema

  const validCreditCard = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Nubank Ultravioleta',
    color: 'black' as const,
    flag: 'mastercard' as const,
    bank: 'nubank' as const,
    last_4_digits: '1234',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('accepts valid credit card', () => {
    const result = sut.safeParse(validCreditCard)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validCreditCard)
  })

  it('accepts credit card with null last_4_digits', () => {
    const card = { ...validCreditCard, last_4_digits: null }

    const result = sut.safeParse(card)

    expect(result.success).toBe(true)
    expect(result.data?.last_4_digits).toBeNull()
  })

  it('rejects credit card with empty name', () => {
    const card = { ...validCreditCard, name: '' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome é obrigatório')
  })

  it('rejects credit card with name exceeding 50 characters', () => {
    const card = { ...validCreditCard, name: 'a'.repeat(51) }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome deve ter no máximo 50 caracteres')
  })

  it('accepts credit card with name at maximum length (50 characters)', () => {
    const card = { ...validCreditCard, name: 'a'.repeat(50) }

    const result = sut.safeParse(card)

    expect(result.success).toBe(true)
  })

  it('rejects credit card with last_4_digits less than 4 characters', () => {
    const card = { ...validCreditCard, last_4_digits: '123' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Deve ter exatamente 4 dígitos')
  })

  it('rejects credit card with last_4_digits more than 4 characters', () => {
    const card = { ...validCreditCard, last_4_digits: '12345' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Deve ter exatamente 4 dígitos')
  })

  it('rejects credit card with non-numeric last_4_digits', () => {
    const card = { ...validCreditCard, last_4_digits: '12ab' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Deve conter apenas números')
  })

  it('rejects credit card with invalid id format', () => {
    const card = { ...validCreditCard, id: 'invalid-uuid' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
  })

  it('rejects credit card with invalid flag', () => {
    const card = { ...validCreditCard, flag: 'discover' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
  })

  it('rejects credit card with invalid bank', () => {
    const card = { ...validCreditCard, bank: 'chase' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
  })

  it('rejects credit card with invalid color', () => {
    const card = { ...validCreditCard, color: 'pink' }

    const result = sut.safeParse(card)

    expect(result.success).toBe(false)
  })
})

describe('createCreditCardSchema', () => {
  const sut = createCreditCardSchema

  const validInput = {
    name: 'Inter Black',
    color: 'black' as const,
    flag: 'mastercard' as const,
    bank: 'inter' as const,
  }

  it('accepts valid create input without last_4_digits', () => {
    const result = sut.safeParse(validInput)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('accepts valid create input with last_4_digits', () => {
    const input = { ...validInput, last_4_digits: '5678' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data?.last_4_digits).toBe('5678')
  })

  it('rejects create input without name', () => {
    const { name: _, ...input } = validInput

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects create input with empty name', () => {
    const input = { ...validInput, name: '' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome é obrigatório')
  })

  it('rejects create input without color', () => {
    const { color: _, ...input } = validInput

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects create input without flag', () => {
    const { flag: _, ...input } = validInput

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects create input without bank', () => {
    const { bank: _, ...input } = validInput

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects create input with invalid last_4_digits format', () => {
    const input = { ...validInput, last_4_digits: 'abcd' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Deve conter apenas números')
  })

  it('rejects create input with last_4_digits wrong length', () => {
    const input = { ...validInput, last_4_digits: '12' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Deve ter exatamente 4 dígitos')
  })
})

describe('updateCreditCardSchema', () => {
  const sut = updateCreditCardSchema

  it('accepts partial update with only name', () => {
    const result = sut.safeParse({ name: 'Updated Card Name' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Updated Card Name' })
  })

  it('accepts partial update with only color', () => {
    const result = sut.safeParse({ color: 'gold' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ color: 'gold' })
  })

  it('accepts partial update with only flag', () => {
    const result = sut.safeParse({ flag: 'visa' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ flag: 'visa' })
  })

  it('accepts partial update with only bank', () => {
    const result = sut.safeParse({ bank: 'bradesco' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ bank: 'bradesco' })
  })

  it('accepts partial update with only last_4_digits', () => {
    const result = sut.safeParse({ last_4_digits: '9999' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ last_4_digits: '9999' })
  })

  it('accepts partial update with null last_4_digits', () => {
    const result = sut.safeParse({ last_4_digits: null })

    expect(result.success).toBe(true)
    expect(result.data?.last_4_digits).toBeNull()
  })

  it('accepts partial update with only is_active', () => {
    const result = sut.safeParse({ is_active: false })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ is_active: false })
  })

  it('accepts empty object (no updates)', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(true)
    expect(result.data).toEqual({})
  })

  it('accepts update with all fields', () => {
    const update = {
      name: 'Updated Card',
      color: 'silver' as const,
      flag: 'elo' as const,
      bank: 'c6_bank' as const,
      last_4_digits: '0000',
      is_active: true,
    }

    const result = sut.safeParse(update)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(update)
  })

  it('rejects update with empty name', () => {
    const result = sut.safeParse({ name: '' })

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome é obrigatório')
  })

  it('rejects update with name exceeding 50 characters', () => {
    const result = sut.safeParse({ name: 'a'.repeat(51) })

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome deve ter no máximo 50 caracteres')
  })

  it('rejects update with invalid color', () => {
    const result = sut.safeParse({ color: 'purple' })

    expect(result.success).toBe(false)
  })

  it('rejects update with invalid flag', () => {
    const result = sut.safeParse({ flag: 'discover' })

    expect(result.success).toBe(false)
  })

  it('rejects update with invalid bank', () => {
    const result = sut.safeParse({ bank: 'wells_fargo' })

    expect(result.success).toBe(false)
  })

  it('rejects update with invalid last_4_digits format', () => {
    const result = sut.safeParse({ last_4_digits: 'test' })

    expect(result.success).toBe(false)
  })

  it('rejects update with invalid is_active type', () => {
    const result = sut.safeParse({ is_active: 'yes' })

    expect(result.success).toBe(false)
  })
})
