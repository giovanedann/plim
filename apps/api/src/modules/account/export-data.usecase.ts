import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { AccountRepository, ExportableTable } from './account.repository'

const EXPORT_COOLDOWN_DAYS = 7

export class ExportDataUseCase {
  constructor(private accountRepository: AccountRepository) {}

  async execute(userId: string, tableName: ExportableTable): Promise<string> {
    const lastExport = await this.accountRepository.getLastExportTime(userId, tableName)

    if (lastExport) {
      const daysSinceLastExport = (Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceLastExport < EXPORT_COOLDOWN_DAYS) {
        throw new AppError(
          ERROR_CODES.RATE_LIMITED,
          'Você já exportou esses dados esta semana. Tente novamente em alguns dias.',
          HTTP_STATUS.TOO_MANY_REQUESTS
        )
      }
    }

    const csvData = await this.getCsvData(userId, tableName)

    if (csvData === null) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        `Erro ao exportar dados: falha ao buscar ${tableName}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    if (csvData === '') {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Nenhum dado encontrado para exportar em ${tableName}`,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const recordSuccess = await this.accountRepository.recordExport(userId, tableName)
    if (!recordSuccess) {
      console.error(`Failed to record export for user ${userId}, table ${tableName}`)
    }

    return csvData
  }

  private async getCsvData(userId: string, tableName: ExportableTable): Promise<string | null> {
    switch (tableName) {
      case 'profile':
        return this.accountRepository.exportProfileAsCsv(userId)
      case 'expenses':
        return this.accountRepository.exportExpensesAsCsv(userId)
      case 'categories':
        return this.accountRepository.exportCategoriesAsCsv(userId)
      case 'credit-cards':
        return this.accountRepository.exportCreditCardsAsCsv(userId)
      case 'salary-history':
        return this.accountRepository.exportSalaryHistoryAsCsv(userId)
      default:
        return null
    }
  }
}
