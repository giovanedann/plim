import { type CreateCreditCard, type CreditCard, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import type { CreditCardsRepository } from './credit-cards.repository'

const createdCreditCard: CreditCard = {
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

describe('CreateCreditCardUseCase', () => {
  let sut: CreateCreditCardUseCase
  let mockRepository: { create: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { create: vi.fn() }
    sut = new CreateCreditCardUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('creates and returns new credit card', async () => {
    const input: CreateCreditCard = {
      name: 'Nubank Ultravioleta',
      color: 'black',
      flag: 'mastercard',
      bank: 'nubank',
      last_4_digits: '1234',
    }
    mockRepository.create.mockResolvedValue(createdCreditCard)

    const result = await sut.execute('user-123', input)

    expect(result).toEqual(createdCreditCard)
    expect(mockRepository.create).toHaveBeenCalledWith('user-123', input)
  })

  it('creates credit card without last_4_digits', async () => {
    const input: CreateCreditCard = {
      name: 'Inter Black',
      color: 'black',
      flag: 'mastercard',
      bank: 'inter',
    }
    const cardWithoutDigits = { ...createdCreditCard, last_4_digits: null }
    mockRepository.create.mockResolvedValue(cardWithoutDigits)

    const result = await sut.execute('user-123', input)

    expect(result.last_4_digits).toBeNull()
    expect(mockRepository.create).toHaveBeenCalledWith('user-123', input)
  })

  it('throws INTERNAL_ERROR when creation fails', async () => {
    const input: CreateCreditCard = {
      name: 'Test Card',
      color: 'black',
      flag: 'visa',
      bank: 'nubank',
    }
    mockRepository.create.mockResolvedValue(null)

    await expect(sut.execute('user-123', input)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', input)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
