import { describe, expect, it } from 'vitest'
import { avatarUploadResponseSchema, profileSchema, updateProfileSchema } from './profile'

describe('profileSchema', () => {
  const sut = profileSchema

  const validProfile = {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: 'https://example.com/avatar.jpg',
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('accepts valid profile', () => {
    const result = sut.safeParse(validProfile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validProfile)
    }
  })

  it('accepts profile with null name', () => {
    const profile = { ...validProfile, name: null }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBeNull()
    }
  })

  it('accepts profile with null avatar_url', () => {
    const profile = { ...validProfile, avatar_url: null }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.avatar_url).toBeNull()
    }
  })

  it('rejects profile with invalid email', () => {
    const profile = { ...validProfile, email: 'invalid-email' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Email inválido')
    }
  })

  it('rejects profile with empty email', () => {
    const profile = { ...validProfile, email: '' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(false)
  })

  it('rejects profile with invalid avatar_url', () => {
    const profile = { ...validProfile, avatar_url: 'not-a-url' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('URL inválida')
    }
  })

  it('rejects profile with invalid user_id', () => {
    const profile = { ...validProfile, user_id: 'invalid-uuid' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(false)
  })

  it('applies default currency (BRL) when not provided', () => {
    const { currency: _, ...profileWithoutCurrency } = validProfile

    const result = sut.safeParse(profileWithoutCurrency)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('BRL')
    }
  })

  it('applies default locale (pt-BR) when not provided', () => {
    const { locale: _, ...profileWithoutLocale } = validProfile

    const result = sut.safeParse(profileWithoutLocale)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe('pt-BR')
    }
  })

  it('applies default is_onboarded (false) when not provided', () => {
    const { is_onboarded: _, ...profileWithoutIsOnboarded } = validProfile

    const result = sut.safeParse(profileWithoutIsOnboarded)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_onboarded).toBe(false)
    }
  })

  it('accepts different currency values (USD)', () => {
    const profile = { ...validProfile, currency: 'USD' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('USD')
    }
  })

  it('accepts different locale values (en-US)', () => {
    const profile = { ...validProfile, locale: 'en-US' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe('en-US')
    }
  })

  it('rejects profile with invalid datetime format', () => {
    const profile = { ...validProfile, created_at: '2024-01-01' }

    const result = sut.safeParse(profile)

    expect(result.success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  const sut = updateProfileSchema

  it('accepts partial update with only name', () => {
    const result = sut.safeParse({ name: 'Jane Doe' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Jane Doe' })
    }
  })

  it('accepts partial update with null name', () => {
    const result = sut.safeParse({ name: null })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBeNull()
    }
  })

  it('accepts partial update with only avatar_url', () => {
    const result = sut.safeParse({ avatar_url: 'https://example.com/new-avatar.jpg' })

    expect(result.success).toBe(true)
  })

  it('accepts partial update with null avatar_url', () => {
    const result = sut.safeParse({ avatar_url: null })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.avatar_url).toBeNull()
    }
  })

  it('accepts partial update with only currency', () => {
    const result = sut.safeParse({ currency: 'EUR' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ currency: 'EUR' })
    }
  })

  it('accepts partial update with only locale', () => {
    const result = sut.safeParse({ locale: 'es-ES' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ locale: 'es-ES' })
    }
  })

  it('accepts partial update with only is_onboarded', () => {
    const result = sut.safeParse({ is_onboarded: true })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ is_onboarded: true })
    }
  })

  it('accepts empty object (no updates)', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('accepts update with all fields', () => {
    const update = {
      name: 'Updated Name',
      avatar_url: 'https://example.com/updated.jpg',
      currency: 'GBP',
      locale: 'en-GB',
      is_onboarded: true,
    }

    const result = sut.safeParse(update)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(update)
    }
  })

  it('rejects update with invalid avatar_url', () => {
    const result = sut.safeParse({ avatar_url: 'not-a-valid-url' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('URL inválida')
    }
  })

  it('rejects update with invalid is_onboarded type', () => {
    const result = sut.safeParse({ is_onboarded: 'yes' })

    expect(result.success).toBe(false)
  })
})

describe('avatarUploadResponseSchema', () => {
  const sut = avatarUploadResponseSchema

  it('accepts valid avatar upload response', () => {
    const response = { avatar_url: 'https://storage.example.com/avatars/123.jpg' }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(response)
    }
  })

  it('rejects response without avatar_url', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects response with invalid avatar_url', () => {
    const result = sut.safeParse({ avatar_url: 'not-a-url' })

    expect(result.success).toBe(false)
  })

  it('rejects response with null avatar_url', () => {
    const result = sut.safeParse({ avatar_url: null })

    expect(result.success).toBe(false)
  })

  it('rejects response with empty string avatar_url', () => {
    const result = sut.safeParse({ avatar_url: '' })

    expect(result.success).toBe(false)
  })
})
