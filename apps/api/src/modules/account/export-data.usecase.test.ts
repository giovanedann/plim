import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { AccountRepository } from './account.repository'
import { ExportDataUseCase } from './export-data.usecase'

describe('ExportDataUseCase', () => {
  let sut: ExportDataUseCase
  let mockRepository: {
    getLastExportTime: ReturnType<typeof vi.fn>
    recordExport: ReturnType<typeof vi.fn>
    exportProfileAsCsv: ReturnType<typeof vi.fn>
    exportExpensesAsCsv: ReturnType<typeof vi.fn>
    exportCategoriesAsCsv: ReturnType<typeof vi.fn>
    exportCreditCardsAsCsv: ReturnType<typeof vi.fn>
    exportSalaryHistoryAsCsv: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      getLastExportTime: vi.fn(),
      recordExport: vi.fn(),
      exportProfileAsCsv: vi.fn(),
      exportExpensesAsCsv: vi.fn(),
      exportCategoriesAsCsv: vi.fn(),
      exportCreditCardsAsCsv: vi.fn(),
      exportSalaryHistoryAsCsv: vi.fn(),
    }
    sut = new ExportDataUseCase(mockRepository as unknown as AccountRepository)
  })

  it('exports profile data as CSV', async () => {
    const csvData = 'user_id,name,email\nuser-123,John,john@test.com'
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportProfileAsCsv.mockResolvedValue(csvData)
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'profile')

    expect(result).toBe(csvData)
    expect(mockRepository.exportProfileAsCsv).toHaveBeenCalledWith('user-123')
    expect(mockRepository.recordExport).toHaveBeenCalledWith('user-123', 'profile')
  })

  it('exports expenses data as CSV', async () => {
    const csvData = 'id,amount,description\n1,1000,Test'
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportExpensesAsCsv.mockResolvedValue(csvData)
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'expenses')

    expect(result).toBe(csvData)
    expect(mockRepository.exportExpensesAsCsv).toHaveBeenCalledWith('user-123')
  })

  it('exports categories data as CSV', async () => {
    const csvData = 'id,name,color\n1,Food,#FF0000'
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportCategoriesAsCsv.mockResolvedValue(csvData)
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'categories')

    expect(result).toBe(csvData)
  })

  it('exports credit-cards data as CSV', async () => {
    const csvData = 'id,name,bank\n1,Nubank,nubank'
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportCreditCardsAsCsv.mockResolvedValue(csvData)
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'credit-cards')

    expect(result).toBe(csvData)
  })

  it('exports salary-history data as CSV', async () => {
    const csvData = 'id,amount,effective_from\n1,500000,2024-01-01'
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportSalaryHistoryAsCsv.mockResolvedValue(csvData)
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'salary-history')

    expect(result).toBe(csvData)
  })

  it('throws RATE_LIMITED when exported within cooldown period', async () => {
    const recentExport = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    mockRepository.getLastExportTime.mockResolvedValue(recentExport)

    await expect(sut.execute('user-123', 'profile')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'profile')).rejects.toMatchObject({
      code: ERROR_CODES.RATE_LIMITED,
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    })
  })

  it('allows export after cooldown period', async () => {
    const oldExport = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    mockRepository.getLastExportTime.mockResolvedValue(oldExport)
    mockRepository.exportProfileAsCsv.mockResolvedValue('csv data')
    mockRepository.recordExport.mockResolvedValue(true)

    const result = await sut.execute('user-123', 'profile')

    expect(result).toBe('csv data')
  })

  it('throws INTERNAL_ERROR when CSV data is null', async () => {
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportProfileAsCsv.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'profile')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'profile')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  it('throws NOT_FOUND when CSV data is empty', async () => {
    mockRepository.getLastExportTime.mockResolvedValue(null)
    mockRepository.exportProfileAsCsv.mockResolvedValue('')

    await expect(sut.execute('user-123', 'profile')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'profile')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
