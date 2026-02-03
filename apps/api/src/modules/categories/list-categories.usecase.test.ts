import { createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoriesRepository } from './categories.repository'
import { ListCategoriesUseCase } from './list-categories.usecase'

type MockRepository = {
  findByUserId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
  }
}

describe('ListCategoriesUseCase', () => {
  let sut: ListCategoriesUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ListCategoriesUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('returns both system and user categories', async () => {
    const systemCategory = createMockCategory({ user_id: null, name: 'Alimentação', icon: '🍔' })
    const userCategory = createMockCategory({
      user_id: 'user-123',
      name: 'Custom Category',
      icon: '⭐',
    })
    mockRepository.findByUserId.mockResolvedValue([systemCategory, userCategory])

    const result = await sut.execute('user-123')

    expect(result).toHaveLength(2)
    expect(result).toContainEqual(systemCategory)
    expect(result).toContainEqual(userCategory)
  })

  it('returns empty array when no categories exist', async () => {
    mockRepository.findByUserId.mockResolvedValue([])

    const result = await sut.execute('user-123')

    expect(result).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles large list of categories', async () => {
      const categories = Array.from({ length: 100 }, (_, i) =>
        createMockCategory({ name: `Category ${i}` })
      )
      mockRepository.findByUserId.mockResolvedValue(categories)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(100)
    })

    it('handles only system categories', async () => {
      const systemCategories = [
        createMockCategory({ user_id: null, name: 'System 1' }),
        createMockCategory({ user_id: null, name: 'System 2' }),
      ]
      mockRepository.findByUserId.mockResolvedValue(systemCategories)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(2)
      expect(result.every((cat) => cat.user_id === null)).toBe(true)
    })

    it('handles only user categories', async () => {
      const userCategories = [
        createMockCategory({ user_id: 'user-123', name: 'User 1' }),
        createMockCategory({ user_id: 'user-123', name: 'User 2' }),
      ]
      mockRepository.findByUserId.mockResolvedValue(userCategories)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(2)
      expect(result.every((cat) => cat.user_id === 'user-123')).toBe(true)
    })
  })
})
