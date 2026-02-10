import { type CreateCategory, ERROR_CODES, HTTP_STATUS, createMockCategory } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'

vi.mock('../../lib/check-plan-limit', () => ({
  checkPlanLimit: vi.fn(),
}))

import { checkPlanLimit } from '../../lib/check-plan-limit'

type MockRepository = {
  create: ReturnType<typeof vi.fn>
  countByUserId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    create: vi.fn(),
    countByUserId: vi.fn().mockResolvedValue(0),
  }
}

const mockSupabase = {} as SupabaseClient

describe('CreateCategoryUseCase', () => {
  let sut: CreateCategoryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = createMockRepository()
    sut = new CreateCategoryUseCase(mockRepository as unknown as CategoriesRepository, mockSupabase)
  })

  it('creates and returns new category', async () => {
    const input: CreateCategory = { name: 'New Category', icon: '🎯', color: '#0000FF' }
    const createdCategory = createMockCategory({
      name: 'New Category',
      icon: '🎯',
      color: '#0000FF',
    })
    mockRepository.create.mockResolvedValue(createdCategory)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdCategory)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    const input: CreateCategory = { name: 'Test', icon: null, color: null }
    mockRepository.create.mockResolvedValue(null)

    await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', input)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary cases', () => {
    it('handles long category name', async () => {
      const longName = 'A'.repeat(100)
      const input: CreateCategory = { name: longName, icon: '📌', color: '#FF0000' }
      const category = createMockCategory({ name: longName })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result.name).toBe(longName)
    })

    it('handles category with null icon and color', async () => {
      const input: CreateCategory = { name: 'Plain Category', icon: null, color: null }
      const category = createMockCategory({ name: 'Plain Category', icon: null, color: null })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result.icon).toBeNull()
      expect(result.color).toBeNull()
    })
  })

  describe('plan limit enforcement', () => {
    it('calls checkPlanLimit before creating category', async () => {
      const input: CreateCategory = { name: 'Test', icon: null, color: null }
      mockRepository.countByUserId.mockResolvedValue(3)
      mockRepository.create.mockResolvedValue(createMockCategory())

      await sut.execute('user-123', input)

      expect(checkPlanLimit).toHaveBeenCalledWith({
        supabase: mockSupabase,
        userId: 'user-123',
        feature: 'categories.custom',
        currentCount: 3,
      })
    })

    it('throws LIMIT_EXCEEDED when free user has 5 custom categories', async () => {
      const input: CreateCategory = { name: 'Test', icon: null, color: null }
      mockRepository.countByUserId.mockResolvedValue(5)
      vi.mocked(checkPlanLimit).mockRejectedValueOnce(
        new AppError(ERROR_CODES.LIMIT_EXCEEDED, 'Plan limit exceeded', HTTP_STATUS.FORBIDDEN)
      )

      await expect(sut.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.LIMIT_EXCEEDED,
        status: HTTP_STATUS.FORBIDDEN,
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('creates category when free user has fewer than 5', async () => {
      const input: CreateCategory = { name: 'Test', icon: null, color: null }
      mockRepository.countByUserId.mockResolvedValue(3)
      const category = createMockCategory({ name: 'Test' })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(category)
      expect(mockRepository.create).toHaveBeenCalled()
    })

    it('creates category for pro user at any count', async () => {
      const input: CreateCategory = { name: 'Test', icon: null, color: null }
      mockRepository.countByUserId.mockResolvedValue(50)
      const category = createMockCategory({ name: 'Test' })
      mockRepository.create.mockResolvedValue(category)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(category)
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })
})
