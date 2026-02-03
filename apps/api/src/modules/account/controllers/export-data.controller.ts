import type { ExportableTable } from '../account.repository'
import type { ExportDataUseCase } from '../export-data.usecase'

export async function exportDataController(
  userId: string,
  table: ExportableTable,
  exportDataUseCase: ExportDataUseCase
): Promise<string> {
  return exportDataUseCase.execute(userId, table)
}
