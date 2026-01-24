import { Section, Text } from '@react-email/components'
import { BaseLayout } from '../components/base-layout'

export default function ResetPasswordEmail() {
  return (
    <BaseLayout preview="Seu código de recuperação do Plim">
      <Section>
        <Text style={headingStyle}>Redefinir senha</Text>
        <Text style={paragraphStyle}>
          Recebemos uma solicitação para redefinir a senha da sua conta no Plim. Use o código abaixo
          para criar uma nova senha:
        </Text>
        <Section style={codeContainerStyle}>
          <Text style={codeStyle}>{'{{ .Token }}'}</Text>
        </Section>
        <Text style={paragraphStyle}>
          Digite este código de 8 dígitos na página de recuperação de senha.
        </Text>
        <Text style={noteStyle}>
          Este código expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este
          email — sua senha atual permanecerá inalterada.
        </Text>
      </Section>
    </BaseLayout>
  )
}

const headingStyle = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
}

const paragraphStyle = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
}

const codeContainerStyle = {
  textAlign: 'center' as const,
  margin: '32px 0',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
}

const codeStyle = {
  color: '#f59e0b',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '8px',
  fontFamily: 'monospace',
  margin: 0,
}

const noteStyle = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0 0',
}
