import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../../middleware/error-handler.middleware'
import type { DeleteAccountUseCase } from '../delete-account.usecase'

export async function deleteAccountController(
  userId: string,
  email: string | null,
  password: string | undefined,
  deleteAccountUseCase: DeleteAccountUseCase
): Promise<void> {
  if (!email) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Perfil não encontrado', HTTP_STATUS.NOT_FOUND)
  }
  if (!password) {
    throw new AppError(ERROR_CODES.INVALID_INPUT, 'Senha é obrigatória', HTTP_STATUS.BAD_REQUEST)
  }
  return deleteAccountUseCase.execute(userId, email, password)
}
