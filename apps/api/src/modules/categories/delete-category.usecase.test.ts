import { type Category, ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoriesRepository } from './categories.repository'
import { DeleteCategoryUseCase } from './delete-category.usecase'

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

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase
  let mockRepository: { findById: ReturnType<typeof vi.fn>; softDelete: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findById: vi.fn(), softDelete: vi.fn() }
    useCase = new DeleteCategoryUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('soft deletes user category', async () => {
    mockRepository.findById.mockResolvedValue(userCategory)
    mockRepository.softDelete.mockResolvedValue(true)

    await expect(useCase.execute('user-123', 'user-1')).resolves.toBeUndefined()
    expect(mockRepository.softDelete).toHaveBeenCalledWith('user-1', 'user-123')
  })

  it('throws NOT_FOUND when category does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute('user-123', 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws FORBIDDEN when trying to delete system category', async () => {
    mockRepository.findById.mockResolvedValue(systemCategory)

    await expect(useCase.execute('user-123', 'system-1')).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })
})
