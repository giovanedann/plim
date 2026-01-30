import { type CreditCard, ERROR_CODES, HTTP_STATUS, type UpdateCreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

const existingCreditCard: CreditCard = {
  id: 'card-123',
  user_id: 'user-123',
  name: 'Nubank Ultravioleta',
  color: 'black',
  flag: 'mastercard',
  bank: 'nubank',
  last_4_digits: '1234',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('UpdateCreditCardUseCase', () => {
  let sut: UpdateCreditCardUseCase
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      update: vi.fn(),
    }
    sut = new UpdateCreditCardUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('updates and returns credit card', async () => {
    const input: UpdateCreditCard = { name: 'Updated Card Name' }
    const updatedCard = { ...existingCreditCard, name: 'Updated Card Name' }
    mockRepository.findById.mockResolvedValue(existingCreditCard)
    mockRepository.update.mockResolvedValue(updatedCard)

    const result = await sut.execute('user-123', 'card-123', input)

    expect(result).toEqual(updatedCard)
    expect(mockRepository.findById).toHaveBeenCalledWith('card-123', 'user-123')
    expect(mockRepository.update).toHaveBeenCalledWith('card-123', 'user-123', input)
  })

  it('updates multiple fields', async () => {
    const input: UpdateCreditCard = {
      name: 'New Name',
      color: 'gold',
      last_4_digits: '9999',
    }
    const updatedCard = { ...existingCreditCard, ...input }
    mockRepository.findById.mockResolvedValue(existingCreditCard)
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
    mockRepository.findById.mockResolvedValue(existingCreditCard)
    mockRepository.update.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'card-123', { name: 'Test' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'card-123', { name: 'Test' })).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
