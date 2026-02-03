import { ERROR_CODES, HTTP_STATUS, type UpdateCategory, createMockCategory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'
import { UpdateCategoryUseCase } from './update-category.usecase'

type MockRepository = {
  findById: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    update: vi.fn(),
  }
}

describe('UpdateCategoryUseCase', () => {
  let sut: UpdateCategoryUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new UpdateCategoryUseCase(mockRepository as unknown as CategoriesRepository)
  })

  it('updates and returns user category', async () => {
    const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
    const input: UpdateCategory = { name: 'Updated Name' }
    const updatedCategory = { ...userCategory, name: 'Updated Name' }
    mockRepository.findById.mockResolvedValue(userCategory)
    mockRepository.update.mockResolvedValue(updatedCategory)

    const result = await sut.execute('user-123', 'user-1', input)

    expect(result.name).toBe('Updated Name')
  })

  it('updates multiple fields at once', async () => {
    const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
    const input: UpdateCategory = {
      name: 'Updated Category',
      icon: 'star',
      color: '#FF0000',
    }
    const updatedCategory = { ...userCategory, ...input }
    mockRepository.findById.mockResolvedValue(userCategory)
    mockRepository.update.mockResolvedValue(updatedCategory)

    const result = await sut.execute('user-123', 'user-1', input)

    expect(result.name).toBe('Updated Category')
    expect(result.icon).toBe('star')
    expect(result.color).toBe('#FF0000')
  })

  it('throws NOT_FOUND when category does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'nonexistent', { name: 'Test' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'nonexistent', { name: 'Test' })).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws FORBIDDEN when trying to modify system category', async () => {
    const systemCategory = createMockCategory({
      id: 'system-1',
      user_id: null,
      name: 'Alimentação',
    })
    mockRepository.findById.mockResolvedValue(systemCategory)

    await expect(sut.execute('user-123', 'system-1', { name: 'Hacked' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'system-1', { name: 'Hacked' })).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  describe('boundary and edge cases', () => {
    it('handles empty name', async () => {
      const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
      const input: UpdateCategory = { name: '' }
      const updatedCategory = { ...userCategory, name: '' }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.name).toBe('')
    })

    it('handles very long name', async () => {
      const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
      const longName = 'A'.repeat(255)
      const input: UpdateCategory = { name: longName }
      const updatedCategory = { ...userCategory, name: longName }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.name).toBe(longName)
      expect(result.name).toHaveLength(255)
    })

    it('handles special characters in name', async () => {
      const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
      const input: UpdateCategory = { name: 'Test & Special <> "Chars"' }
      const updatedCategory = { ...userCategory, name: 'Test & Special <> "Chars"' }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.name).toBe('Test & Special <> "Chars"')
    })

    it('handles emoji icons', async () => {
      const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
      const input: UpdateCategory = { icon: '🎉' }
      const updatedCategory = { ...userCategory, icon: '🎉' }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.icon).toBe('🎉')
    })

    it('handles hex color codes', async () => {
      const userCategory = createMockCategory({ id: 'user-1', user_id: 'user-123' })
      const input: UpdateCategory = { color: '#AABBCC' }
      const updatedCategory = { ...userCategory, color: '#AABBCC' }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.color).toBe('#AABBCC')
    })

    it('handles deactivating category', async () => {
      const userCategory = createMockCategory({
        id: 'user-1',
        user_id: 'user-123',
        is_active: true,
      })
      const input: UpdateCategory = { is_active: false }
      const updatedCategory = { ...userCategory, is_active: false }
      mockRepository.findById.mockResolvedValue(userCategory)
      mockRepository.update.mockResolvedValue(updatedCategory)

      const result = await sut.execute('user-123', 'user-1', input)

      expect(result.is_active).toBe(false)
    })
  })
})
