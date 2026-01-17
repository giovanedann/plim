import type { Category } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoriesRepository } from './categories.repository'
import { ListCategoriesUseCase } from './list-categories.usecase'

const systemCategory: Category = {
  id: 'system-1',
  user_id: null,
  name: 'Alimentação',
  icon: '🍔',
  color: '#FF5733',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const userCategory: Category = {
  id: 'user-1',
  user_id: 'user-123',
  name: 'Custom Category',
  icon: '⭐',
  color: '#00FF00',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ListCategoriesUseCase', () => {
  let useCase: ListCategoriesUseCase
  let mockRepository: { findByUserId: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findByUserId: vi.fn() }
    useCase = new ListCategoriesUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('returns both system and user categories', async () => {
    mockRepository.findByUserId.mockResolvedValue([systemCategory, userCategory])

    const result = await useCase.execute('user-123')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual(systemCategory)
    expect(result).toContainEqual(userCategory)
  })

  it('returns empty array when no categories exist', async () => {
    mockRepository.findByUserId.mockResolvedValue([])

    const result = await useCase.execute('user-123')

    expect(result).toEqual([])
  })
})
