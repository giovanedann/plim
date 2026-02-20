import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReferralRepository } from './referral.repository'
import { ValidateReferralCodeUseCase } from './validate-referral-code.usecase'

type MockRepository = Pick<ReferralRepository, 'getProfileByReferralCode'>

function createMockRepository(): MockRepository {
  return {
    getProfileByReferralCode: vi.fn(),
  }
}

describe('ValidateReferralCodeUseCase', () => {
  let sut: ValidateReferralCodeUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ValidateReferralCodeUseCase(mockRepository as ReferralRepository)
  })

  it('returns valid=true and referrer first name for existing code', async () => {
    mockRepository.getProfileByReferralCode = vi.fn().mockResolvedValue({
      user_id: 'user-123',
      name: 'Giovane Daniel',
    })

    const result = await sut.execute('giovane')

    expect(result).toEqual({ valid: true, referrer_name: 'Giovane' })
    expect(mockRepository.getProfileByReferralCode).toHaveBeenCalledWith('giovane')
  })

  it('returns only first name when referrer has multiple names', async () => {
    mockRepository.getProfileByReferralCode = vi.fn().mockResolvedValue({
      user_id: 'user-456',
      name: 'Maria Clara Santos',
    })

    const result = await sut.execute('maria-clara')

    expect(result).toEqual({ valid: true, referrer_name: 'Maria' })
  })

  it('returns valid=false for non-existent code', async () => {
    mockRepository.getProfileByReferralCode = vi.fn().mockResolvedValue(null)

    const result = await sut.execute('non-existent-code')

    expect(result).toEqual({ valid: false, referrer_name: null })
  })

  it('returns valid=false for empty code', async () => {
    const result = await sut.execute('')

    expect(result).toEqual({ valid: false, referrer_name: null })
    expect(mockRepository.getProfileByReferralCode).not.toHaveBeenCalled()
  })

  it('returns valid=true with null name when referrer has no name', async () => {
    mockRepository.getProfileByReferralCode = vi.fn().mockResolvedValue({
      user_id: 'user-789',
      name: null,
    })

    const result = await sut.execute('anonymous')

    expect(result).toEqual({ valid: true, referrer_name: null })
  })
})
