import { describe, expect, it } from 'vitest'
import { deleteAccountSchema } from './account'

describe('deleteAccountSchema', () => {
  const sut = deleteAccountSchema

  it('accepts input with password', () => {
    const input = { password: 'mySecurePassword123' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it('accepts input with empty string password', () => {
    const input = { password: '' }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.password).toBe('')
    }
  })

  it('accepts input without password field', () => {
    const input = {}

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('accepts input with undefined password', () => {
    const input = { password: undefined }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.password).toBeUndefined()
    }
  })

  it('rejects input with non-string password', () => {
    const input = { password: 12345 }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input with null password', () => {
    const input = { password: null }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input with object password', () => {
    const input = { password: { value: 'password' } }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects input with array password', () => {
    const input = { password: ['password'] }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('strips extra fields', () => {
    const input = {
      password: 'myPassword',
      extraField: 'should be stripped',
      userId: '123',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('extraField')
      expect(result.data).not.toHaveProperty('userId')
    }
  })
})
