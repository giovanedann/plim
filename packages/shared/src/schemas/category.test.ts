import { describe, expect, it } from 'vitest'
import { categorySchema, createCategorySchema, updateCategorySchema } from './category'

describe('categorySchema', () => {
  const sut = categorySchema

  const validCategory = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Groceries',
    icon: '🛒',
    color: '#FF5733',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('accepts valid category', () => {
    const result = sut.safeParse(validCategory)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validCategory)
  })

  it('accepts category with null user_id (system category)', () => {
    const category = { ...validCategory, user_id: null }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
    expect(result.data?.user_id).toBeNull()
  })

  it('accepts category with null icon', () => {
    const category = { ...validCategory, icon: null }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
    expect(result.data?.icon).toBeNull()
  })

  it('accepts category with null color', () => {
    const category = { ...validCategory, color: null }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
    expect(result.data?.color).toBeNull()
  })

  it('rejects category with empty name', () => {
    const category = { ...validCategory, name: '' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome é obrigatório')
  })

  it('rejects category with name exceeding 50 characters', () => {
    const category = { ...validCategory, name: 'a'.repeat(51) }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome deve ter no máximo 50 caracteres')
  })

  it('accepts category with name at maximum length (50 characters)', () => {
    const category = { ...validCategory, name: 'a'.repeat(50) }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
  })

  it('rejects category with invalid color format (no hash)', () => {
    const category = { ...validCategory, color: 'FF5733' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Cor deve estar no formato hexadecimal (#000000)')
  })

  it('rejects category with invalid color format (wrong length)', () => {
    const category = { ...validCategory, color: '#FFF' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Cor deve estar no formato hexadecimal (#000000)')
  })

  it('rejects category with invalid color format (invalid characters)', () => {
    const category = { ...validCategory, color: '#GGGGGG' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
  })

  it('accepts category with lowercase hex color', () => {
    const category = { ...validCategory, color: '#ff5733' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
  })

  it('accepts category with mixed case hex color', () => {
    const category = { ...validCategory, color: '#Ff5733' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(true)
  })

  it('applies default value for is_active', () => {
    const { is_active: _, ...categoryWithoutIsActive } = validCategory

    const result = sut.safeParse(categoryWithoutIsActive)

    expect(result.success).toBe(true)
    expect(result.data?.is_active).toBe(true)
  })

  it('rejects category with invalid id format', () => {
    const category = { ...validCategory, id: 'invalid-uuid' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
  })

  it('rejects category with invalid datetime format', () => {
    const category = { ...validCategory, created_at: '2024-01-01' }

    const result = sut.safeParse(category)

    expect(result.success).toBe(false)
  })
})

describe('createCategorySchema', () => {
  const sut = createCategorySchema

  it('accepts valid create input with all fields', () => {
    const input = {
      name: 'Transportation',
      icon: '🚗',
      color: '#3498DB',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(input)
  })

  it('accepts create input with null icon', () => {
    const input = {
      name: 'Transportation',
      icon: null,
      color: '#3498DB',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('accepts create input with null color', () => {
    const input = {
      name: 'Transportation',
      icon: '🚗',
      color: null,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('rejects create input without name', () => {
    const input = {
      icon: '🚗',
      color: '#3498DB',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
  })

  it('rejects create input with empty name', () => {
    const input = {
      name: '',
      icon: '🚗',
      color: '#3498DB',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome é obrigatório')
  })

  it('rejects create input with name exceeding 50 characters', () => {
    const input = {
      name: 'a'.repeat(51),
      icon: '🚗',
      color: '#3498DB',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Nome deve ter no máximo 50 caracteres')
  })

  it('rejects create input with invalid color format', () => {
    const input = {
      name: 'Transportation',
      icon: '🚗',
      color: 'blue',
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Cor deve estar no formato hexadecimal (#000000)')
  })

  it('does not include is_active field', () => {
    const input = {
      name: 'Transportation',
      icon: '🚗',
      color: '#3498DB',
      is_active: false,
    }

    const result = sut.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('is_active')
  })
})

describe('updateCategorySchema', () => {
  const sut = updateCategorySchema

  it('accepts partial update with only name', () => {
    const result = sut.safeParse({ name: 'Updated Name' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Updated Name' })
  })

  it('accepts partial update with only icon', () => {
    const result = sut.safeParse({ icon: '🏠' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ icon: '🏠' })
  })

  it('accepts partial update with only color', () => {
    const result = sut.safeParse({ color: '#9B59B6' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ color: '#9B59B6' })
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
      name: 'Updated Category',
      icon: '🎯',
      color: '#E74C3C',
      is_active: true,
    }

    const result = sut.safeParse(update)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(update)
  })

  it('accepts update with null icon', () => {
    const result = sut.safeParse({ icon: null })

    expect(result.success).toBe(true)
    expect(result.data?.icon).toBeNull()
  })

  it('accepts update with null color', () => {
    const result = sut.safeParse({ color: null })

    expect(result.success).toBe(true)
    expect(result.data?.color).toBeNull()
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

  it('rejects update with invalid color format', () => {
    const result = sut.safeParse({ color: 'red' })

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Cor deve estar no formato hexadecimal (#000000)')
  })

  it('rejects update with invalid is_active type', () => {
    const result = sut.safeParse({ is_active: 'yes' })

    expect(result.success).toBe(false)
  })
})
