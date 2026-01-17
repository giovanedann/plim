import { type Category, type CreateCategory, ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'

const createdCategory: Category = {
  id: 'new-1',
  user_id: 'user-123',
  name: 'New Category',
  icon: '🎯',
  color: '#0000FF',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase
  let mockRepository: { create: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { create: vi.fn() }
    useCase = new CreateCategoryUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('creates and returns new category', async () => {
    const input: CreateCategory = { name: 'New Category', icon: '🎯', color: '#0000FF' }
    mockRepository.create.mockResolvedValue(createdCategory)

    const result = await useCase.execute('user-123', input)

    expect(result).toEqual(createdCategory)
    expect(mockRepository.create).toHaveBeenCalledWith('user-123', input)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    mockRepository.create.mockResolvedValue(null)

    await expect(
      useCase.execute('user-123', { name: 'Test', icon: null, color: null })
    ).rejects.toThrow(AppError)
    await expect(
      useCase.execute('user-123', { name: 'Test', icon: null, color: null })
    ).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
