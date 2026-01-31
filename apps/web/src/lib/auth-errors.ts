const authErrorTranslations: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada',
  'User already registered': 'Este email já está cadastrado',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'Signup requires a valid password': 'Senha inválida',
  'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde',
  'Token has expired or is invalid': 'Link expirado ou inválido',
  'New password should be different from the old password':
    'A nova senha deve ser diferente da senha atual',
  'Unable to validate email address: invalid format': 'Formato de email inválido',
  'For security purposes, you can only request this once every 60 seconds':
    'Por segurança, aguarde 60 segundos antes de tentar novamente',
}

export function translateAuthError(error: string): string {
  return authErrorTranslations[error] || error
}
