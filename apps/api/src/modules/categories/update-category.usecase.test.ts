import { type Category, ERROR_CODES, HTTP_STATUS, type UpdateCategory } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoriesRepository } from './categories.repository'
import { UpdateCategoryUseCase } from './update-category.usecase'

const userCategory: Category = {
  id: 'user-1',
  user_id: 'user-123',
  name: 'My Category',
  icon: '⭐',
  color: '#00FF00',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

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

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase
  let mockRepository: { findById: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findById: vi.fn(), update: vi.fn() }
    useCase = new UpdateCategoryUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('updates and returns user category', async () => {
    const input: UpdateCategory = { name: 'Updated Name' }
    const updatedCategory = { ...userCategory, name: 'Updated Name' }
    mockRepository.findById.mockResolvedValue(userCategory)
    mockRepository.update.mockResolvedValue(updatedCategory)

    const result = await useCase.execute('user-123', 'user-1', input)

    expect(result.name).toBe('Updated Name')
  })

  it('throws NOT_FOUND when category does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(
      useCase.execute('user-123', 'nonexistent', { name: 'Test' })
    ).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws FORBIDDEN when trying to modify system category', async () => {
    mockRepository.findById.mockResolvedValue(systemCategory)

    await expect(useCase.execute('user-123', 'system-1', { name: 'Hacked' })).rejects.toMatchObject(
      {
        code: ERROR_CODES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }
    )
  })
})
