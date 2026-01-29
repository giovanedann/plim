import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../../middleware/error-handler.middleware'

export class DeleteAccountUseCase {
  constructor(
    private userSupabase: SupabaseClient,
    private adminSupabase: SupabaseClient
  ) {}

  async execute(userId: string, email: string, password?: string): Promise<void> {
    const isSocialLogin = await this.checkIfSocialLoginOnly(userId)

    if (!isSocialLogin) {
      if (!password) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Senha é obrigatória',
          HTTP_STATUS.BAD_REQUEST
        )
      }

      const { error: signInError } = await this.userSupabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Senha incorreta', HTTP_STATUS.UNAUTHORIZED)
      }
    }

    const { error: deleteError } = await this.adminSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Erro ao excluir conta. Tente novamente.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }

  private async checkIfSocialLoginOnly(userId: string): Promise<boolean> {
    const { data: user, error } = await this.adminSupabase.auth.admin.getUserById(userId)

    if (error || !user) {
      return false
    }

    const identities = user.user.identities ?? []
    const hasEmailProvider = identities.some((identity) => identity.provider === 'email')

    return !hasEmailProvider
  }
}
