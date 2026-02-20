import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { ClaimReferralUseCase } from './claim-referral.usecase'
import type { ReferralRepository } from './referral.repository'

type MockRepository = {
  claimReferral: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    claimReferral: vi.fn(),
  }
}

describe('ClaimReferralUseCase', () => {
  let sut: ClaimReferralUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ClaimReferralUseCase(mockRepository as unknown as ReferralRepository)
  })

  it('successfully claims referral via RPC and returns pro_days_granted', async () => {
    mockRepository.claimReferral.mockResolvedValue({ pro_days_granted: 7 })

    const result = await sut.execute('user-123', { referral_code: 'valid-code' })

    expect(result).toEqual({ pro_days_granted: 7 })
    expect(mockRepository.claimReferral).toHaveBeenCalledWith('valid-code', 'user-123')
  })

  it('maps invalid_referral_code exception to 400', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('invalid_referral_code'))

    await expect(sut.execute('user-123', { referral_code: 'bad-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'bad-code' })).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('maps invalid_code exception to 400', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('invalid_code'))

    await expect(sut.execute('user-123', { referral_code: 'bad-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'bad-code' })).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('maps self_referral exception to 403', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('self_referral'))

    await expect(sut.execute('user-123', { referral_code: 'my-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'my-code' })).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  it('maps already_referred exception to 409', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('already_referred'))

    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toMatchObject({
      code: ERROR_CODES.ALREADY_EXISTS,
      status: HTTP_STATUS.CONFLICT,
    })
  })

  it('maps account_too_old exception to 403', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('account_too_old'))

    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  it('handles unexpected RPC errors gracefully', async () => {
    mockRepository.claimReferral.mockRejectedValue(new Error('connection_timeout'))

    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  it('handles non-Error thrown values gracefully', async () => {
    mockRepository.claimReferral.mockRejectedValue('string error')

    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { referral_code: 'some-code' })).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
