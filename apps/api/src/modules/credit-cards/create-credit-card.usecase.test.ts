import { type CreateCreditCard, type CreditCard, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import type { CreditCardsRepository } from './credit-cards.repository'

vi.mock('../../lib/check-plan-limit', () => ({
  checkPlanLimit: vi.fn(),
}))

import { checkPlanLimit } from '../../lib/check-plan-limit'

const createdCreditCard: CreditCard = {
  id: 'card-123',
  user_id: 'user-123',
  name: 'Nubank Ultravioleta',
  color: 'black',
  flag: 'mastercard',
  bank: 'nubank',
  last_4_digits: '1234',
  expiration_day: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

type MockRepository = {
  create: ReturnType<typeof vi.fn>
  countByUserId: ReturnType<typeof vi.fn>
}

const mockSupabase = {} as SupabaseClient

describe('CreateCreditCardUseCase', () => {
  let sut: CreateCreditCardUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = {
      create: vi.fn(),
      countByUserId: vi.fn().mockResolvedValue(0),
    }
    sut = new CreateCreditCardUseCase(
      mockRepository as unknown as CreditCardsRepository,
      mockSupabase
    )
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

  describe('plan limit enforcement', () => {
    it('calls checkPlanLimit before creating credit card', async () => {
      const input: CreateCreditCard = {
        name: 'Test',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
      }
      mockRepository.countByUserId.mockResolvedValue(1)
      mockRepository.create.mockResolvedValue(createdCreditCard)

      await sut.execute('user-123', input)

      expect(checkPlanLimit).toHaveBeenCalledWith({
        supabase: mockSupabase,
        userId: 'user-123',
        feature: 'creditCards',
        currentCount: 1,
      })
    })

    it('throws LIMIT_EXCEEDED when free user has 2 credit cards', async () => {
      const input: CreateCreditCard = {
        name: 'Test',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
      }
      mockRepository.countByUserId.mockResolvedValue(2)
      vi.mocked(checkPlanLimit).mockRejectedValueOnce(
        new AppError(ERROR_CODES.LIMIT_EXCEEDED, 'Plan limit exceeded', HTTP_STATUS.FORBIDDEN)
      )

      await expect(sut.execute('user-123', input)).rejects.toMatchObject({
        code: ERROR_CODES.LIMIT_EXCEEDED,
        status: HTTP_STATUS.FORBIDDEN,
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('creates credit card when free user has fewer than 2', async () => {
      const input: CreateCreditCard = {
        name: 'Test',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
      }
      mockRepository.countByUserId.mockResolvedValue(1)
      mockRepository.create.mockResolvedValue(createdCreditCard)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(createdCreditCard)
      expect(mockRepository.create).toHaveBeenCalled()
    })

    it('creates credit card for pro user at any count', async () => {
      const input: CreateCreditCard = {
        name: 'Test',
        color: 'black',
        flag: 'visa',
        bank: 'nubank',
      }
      mockRepository.countByUserId.mockResolvedValue(20)
      mockRepository.create.mockResolvedValue(createdCreditCard)

      const result = await sut.execute('user-123', input)

      expect(result).toEqual(createdCreditCard)
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })
})
