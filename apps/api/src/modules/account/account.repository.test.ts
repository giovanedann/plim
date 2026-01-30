import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountRepository, type ExportableTable } from './account.repository'

function createMockSupabaseClient() {
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()
  const mockCsv = vi.fn()
  const mockOrder = vi.fn()
  const mockOr = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockUpsert = vi.fn()
  const mockFrom = vi.fn()

  mockFrom.mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
    or: mockOr,
    order: mockOrder,
    csv: mockCsv,
    single: mockSingle,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
    csv: mockCsv,
  })

  mockOr.mockReturnValue({
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    csv: mockCsv,
  })

  const supabase = {
    from: mockFrom,
  } as unknown as SupabaseClient

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockEq,
    mockOr,
    mockOrder,
    mockSingle,
    mockMaybeSingle,
    mockCsv,
    mockUpsert,
  }
}

describe('AccountRepository', () => {
  let sut: AccountRepository
  let mocks: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mocks = createMockSupabaseClient()
    sut = new AccountRepository(mocks.supabase)
  })

  describe('getUserEmail', () => {
    it('returns email when profile exists', async () => {
      // Arrange
      const userId = 'user-123'
      const expectedEmail = 'test@example.com'
      mocks.mockSingle.mockResolvedValue({
        data: { email: expectedEmail },
        error: null,
      })

      // Act
      const result = await sut.getUserEmail(userId)

      // Assert
      expect(result).toBe(expectedEmail)
      expect(mocks.mockFrom).toHaveBeenCalledWith('profile')
      expect(mocks.mockSelect).toHaveBeenCalledWith('email')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns null when profile does not exist', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await sut.getUserEmail(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when query fails', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      })

      // Act
      const result = await sut.getUserEmail(userId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getLastExportTime', () => {
    it('returns export time when record exists', async () => {
      // Arrange
      const userId = 'user-123'
      const tableName: ExportableTable = 'expenses'
      const exportedAt = '2024-01-15T10:00:00Z'
      mocks.mockMaybeSingle.mockResolvedValue({
        data: { exported_at: exportedAt },
        error: null,
      })

      // Act
      const result = await sut.getLastExportTime(userId, tableName)

      // Assert
      expect(result).toEqual(new Date(exportedAt))
      expect(mocks.mockFrom).toHaveBeenCalledWith('data_export_log')
      expect(mocks.mockSelect).toHaveBeenCalledWith('exported_at')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockEq).toHaveBeenCalledWith('table_name', tableName)
    })

    it('returns null when no export record exists', async () => {
      // Arrange
      const userId = 'user-123'
      const tableName: ExportableTable = 'expenses'
      mocks.mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await sut.getLastExportTime(userId, tableName)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null and logs error when query fails', async () => {
      // Arrange
      const userId = 'user-123'
      const tableName: ExportableTable = 'expenses'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockMaybeSingle.mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      })

      // Act
      const result = await sut.getLastExportTime(userId, tableName)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error getting last export time for ${tableName}:`,
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('recordExport', () => {
    it('returns true when export is recorded successfully', async () => {
      // Arrange
      const userId = 'user-123'
      const tableName: ExportableTable = 'profile'
      mocks.mockUpsert.mockResolvedValue({ error: null })

      // Act
      const result = await sut.recordExport(userId, tableName)

      // Assert
      expect(result).toBe(true)
      expect(mocks.mockFrom).toHaveBeenCalledWith('data_export_log')
      expect(mocks.mockUpsert).toHaveBeenCalledWith(
        {
          user_id: userId,
          table_name: tableName,
          exported_at: expect.any(String),
        },
        { onConflict: 'user_id,table_name' }
      )
    })

    it('returns false and logs error when upsert fails', async () => {
      // Arrange
      const userId = 'user-123'
      const tableName: ExportableTable = 'profile'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockUpsert.mockResolvedValue({ error: new Error('Upsert failed') })

      // Act
      const result = await sut.recordExport(userId, tableName)

      // Assert
      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error recording export for ${tableName}:`,
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('exportProfileAsCsv', () => {
    it('returns CSV data when export succeeds', async () => {
      // Arrange
      const userId = 'user-123'
      const csvData = 'user_id,name,email\nuser-123,Test,test@example.com'
      mocks.mockCsv.mockResolvedValue({ data: csvData, error: null })

      // Act
      const result = await sut.exportProfileAsCsv(userId)

      // Assert
      expect(result).toBe(csvData)
      expect(mocks.mockFrom).toHaveBeenCalledWith('profile')
      expect(mocks.mockSelect).toHaveBeenCalledWith(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, created_at, updated_at'
      )
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns empty string when data is null', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockCsv.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await sut.exportProfileAsCsv(userId)

      // Assert
      expect(result).toBe('')
    })

    it('returns null and logs error when export fails', async () => {
      // Arrange
      const userId = 'user-123'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockCsv.mockResolvedValue({ data: null, error: new Error('Export failed') })

      // Act
      const result = await sut.exportProfileAsCsv(userId)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error exporting profile:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('exportExpensesAsCsv', () => {
    it('returns CSV data when export succeeds', async () => {
      // Arrange
      const userId = 'user-123'
      const csvData = 'id,description,amount_cents\nexp-1,Test,5000'
      mocks.mockCsv.mockResolvedValue({ data: csvData, error: null })

      // Act
      const result = await sut.exportExpensesAsCsv(userId)

      // Assert
      expect(result).toBe(csvData)
      expect(mocks.mockFrom).toHaveBeenCalledWith('expense')
    })

    it('returns null and logs error when export fails', async () => {
      // Arrange
      const userId = 'user-123'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockCsv.mockResolvedValue({ data: null, error: new Error('Export failed') })

      // Act
      const result = await sut.exportExpensesAsCsv(userId)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error exporting expenses:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('exportCategoriesAsCsv', () => {
    it('returns CSV data when export succeeds', async () => {
      // Arrange
      const userId = 'user-123'
      const csvData = 'id,name,icon,color\ncat-1,Food,food,#ff0000'
      mocks.mockCsv.mockResolvedValue({ data: csvData, error: null })

      // Act
      const result = await sut.exportCategoriesAsCsv(userId)

      // Assert
      expect(result).toBe(csvData)
      expect(mocks.mockFrom).toHaveBeenCalledWith('category')
      expect(mocks.mockOr).toHaveBeenCalledWith(`user_id.eq.${userId},user_id.is.null`)
    })

    it('returns null and logs error when export fails', async () => {
      // Arrange
      const userId = 'user-123'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockCsv.mockResolvedValue({ data: null, error: new Error('Export failed') })

      // Act
      const result = await sut.exportCategoriesAsCsv(userId)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error exporting categories:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  describe('exportCreditCardsAsCsv', () => {
    it('returns CSV data when export succeeds', async () => {
      // Arrange
      const userId = 'user-123'
      const csvData = 'id,name,color,flag\ncard-1,My Card,#0000ff,visa'
      mocks.mockCsv.mockResolvedValue({ data: csvData, error: null })

      // Act
      const result = await sut.exportCreditCardsAsCsv(userId)

      // Assert
      expect(result).toBe(csvData)
      expect(mocks.mockFrom).toHaveBeenCalledWith('credit_card')
    })

    it('returns null and logs error when export fails', async () => {
      // Arrange
      const userId = 'user-123'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockCsv.mockResolvedValue({ data: null, error: new Error('Export failed') })

      // Act
      const result = await sut.exportCreditCardsAsCsv(userId)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error exporting credit cards:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
  })

  describe('exportSalaryHistoryAsCsv', () => {
    it('returns CSV data when export succeeds', async () => {
      // Arrange
      const userId = 'user-123'
      const csvData = 'id,amount_cents,effective_from\nsal-1,500000,2024-01-01'
      mocks.mockCsv.mockResolvedValue({ data: csvData, error: null })

      // Act
      const result = await sut.exportSalaryHistoryAsCsv(userId)

      // Assert
      expect(result).toBe(csvData)
      expect(mocks.mockFrom).toHaveBeenCalledWith('salary_history')
    })

    it('returns null and logs error when export fails', async () => {
      // Arrange
      const userId = 'user-123'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.mockCsv.mockResolvedValue({ data: null, error: new Error('Export failed') })

      // Act
      const result = await sut.exportSalaryHistoryAsCsv(userId)

      // Assert
      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error exporting salary history:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })
  })
})
