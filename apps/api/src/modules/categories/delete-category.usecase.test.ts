import { ERROR_CODES, HTTP_STATUS, createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoriesRepository } from './categories.repository'
import { DeleteCategoryUseCase } from './delete-category.usecase'

type MockRepository = Pick<CategoriesRepository, 'findById' | 'softDelete'>

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    softDelete: vi.fn(),
  }
}

describe('DeleteCategoryUseCase', () => {
  let sut: DeleteCategoryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new DeleteCategoryUseCase(mockRepository as CategoriesRepository)
  })

  it('soft deletes user category', async () => {
    const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
    mockRepository.findById = vi.fn().mockResolvedValue(userCategory)
    mockRepository.softDelete = vi.fn().mockResolvedValue(true)

    await expect(sut.execute('user-123', 'user-1')).resolves.toBeUndefined()
  })

  it('throws NOT_FOUND when category does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123', 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws FORBIDDEN when trying to delete system category', async () => {
    const systemCategory = createMockCategory({ id: 'system-1', user_id: null })
    mockRepository.findById = vi.fn().mockResolvedValue(systemCategory)

    await expect(sut.execute('user-123', 'system-1')).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })
})
