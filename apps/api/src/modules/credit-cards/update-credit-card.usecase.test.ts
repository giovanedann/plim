import { ERROR_CODES, HTTP_STATUS, type UpdateCreditCard, createMockCreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

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

describe('UpdateCreditCardUseCase', () => {
  let sut: UpdateCreditCardUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new UpdateCreditCardUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('updates and returns credit card', async () => {
    const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
    const input: UpdateCreditCard = { name: 'Updated Card Name' }
    const updatedCard = { ...existingCard, name: 'Updated Card Name' }
    mockRepository.findById.mockResolvedValue(existingCard)
    mockRepository.update.mockResolvedValue(updatedCard)

    const result = await sut.execute('user-123', 'card-123', input)

    expect(result.name).toBe('Updated Card Name')
  })

  it('updates multiple fields', async () => {
    const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
    const input: UpdateCreditCard = {
      name: 'New Name',
      color: 'gold',
      last_4_digits: '9999',
    }
    const updatedCard = { ...existingCard, ...input }
    mockRepository.findById.mockResolvedValue(existingCard)
    mockRepository.update.mockResolvedValue(updatedCard)

    const result = await sut.execute('user-123', 'card-123', input)

    expect(result.name).toBe('New Name')
    expect(result.color).toBe('gold')
    expect(result.last_4_digits).toBe('9999')
  })

  it('throws NOT_FOUND when credit card does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'nonexistent', { name: 'Test' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'nonexistent', { name: 'Test' })).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND when credit card belongs to different user', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('other-user', 'card-123', { name: 'Test' })).rejects.toThrow(AppError)
    await expect(sut.execute('other-user', 'card-123', { name: 'Test' })).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws INTERNAL_ERROR when update fails', async () => {
    const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
    mockRepository.findById.mockResolvedValue(existingCard)
    mockRepository.update.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'card-123', { name: 'Test' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'card-123', { name: 'Test' })).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary and edge cases', () => {
    it('handles empty name', async () => {
      const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
      const input: UpdateCreditCard = { name: '' }
      const updatedCard = { ...existingCard, name: '' }
      mockRepository.findById.mockResolvedValue(existingCard)
      mockRepository.update.mockResolvedValue(updatedCard)

      const result = await sut.execute('user-123', 'card-123', input)

      expect(result.name).toBe('')
    })

    it('handles very long name', async () => {
      const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
      const longName = 'A'.repeat(100)
      const input: UpdateCreditCard = { name: longName }
      const updatedCard = { ...existingCard, name: longName }
      mockRepository.findById.mockResolvedValue(existingCard)
      mockRepository.update.mockResolvedValue(updatedCard)

      const result = await sut.execute('user-123', 'card-123', input)

      expect(result.name).toBe(longName)
      expect(result.name).toHaveLength(100)
    })

    it('handles all valid card flags', async () => {
      const existingCard = createMockCreditCard({
        id: 'card-123',
        user_id: 'user-123',
        flag: 'visa',
      })
      const flags = ['visa', 'mastercard', 'elo', 'american_express', 'hipercard'] as const

      for (const flag of flags) {
        const input: UpdateCreditCard = { flag }
        const updatedCard = { ...existingCard, flag }
        mockRepository.findById.mockResolvedValue(existingCard)
        mockRepository.update.mockResolvedValue(updatedCard)

        const result = await sut.execute('user-123', 'card-123', input)

        expect(result.flag).toBe(flag)
      }
    })

    it('handles all valid banks', async () => {
      const existingCard = createMockCreditCard({
        id: 'card-123',
        user_id: 'user-123',
        bank: 'nubank',
      })
      const banks = [
        'nubank',
        'inter',
        'itau',
        'bradesco',
        'santander',
        'c6_bank',
        'other',
      ] as const

      for (const bank of banks) {
        const input: UpdateCreditCard = { bank }
        const updatedCard = { ...existingCard, bank }
        mockRepository.findById.mockResolvedValue(existingCard)
        mockRepository.update.mockResolvedValue(updatedCard)

        const result = await sut.execute('user-123', 'card-123', input)

        expect(result.bank).toBe(bank)
      }
    })

    it('handles 4-digit last digits', async () => {
      const existingCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
      const input: UpdateCreditCard = { last_4_digits: '0000' }
      const updatedCard = { ...existingCard, last_4_digits: '0000' }
      mockRepository.findById.mockResolvedValue(existingCard)
      mockRepository.update.mockResolvedValue(updatedCard)

      const result = await sut.execute('user-123', 'card-123', input)

      expect(result.last_4_digits).toBe('0000')
      expect(result.last_4_digits).toHaveLength(4)
    })

    it('handles deactivating card', async () => {
      const existingCard = createMockCreditCard({
        id: 'card-123',
        user_id: 'user-123',
        is_active: true,
      })
      const input: UpdateCreditCard = { is_active: false }
      const updatedCard = { ...existingCard, is_active: false }
      mockRepository.findById.mockResolvedValue(existingCard)
      mockRepository.update.mockResolvedValue(updatedCard)

      const result = await sut.execute('user-123', 'card-123', input)

      expect(result.is_active).toBe(false)
    })

    it('handles reactivating card', async () => {
      const existingCard = createMockCreditCard({
        id: 'card-123',
        user_id: 'user-123',
        is_active: false,
      })
      const input: UpdateCreditCard = { is_active: true }
      const updatedCard = { ...existingCard, is_active: true }
      mockRepository.findById.mockResolvedValue(existingCard)
      mockRepository.update.mockResolvedValue(updatedCard)

      const result = await sut.execute('user-123', 'card-123', input)

      expect(result.is_active).toBe(true)
    })
  })
})
