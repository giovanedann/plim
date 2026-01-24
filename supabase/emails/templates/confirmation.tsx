import { Link, Section, Text } from '@react-email/components'
import { BaseLayout } from '../components/base-layout'
import { Button } from '../components/button'

export default function ConfirmationEmail() {
  return (
    <BaseLayout preview="Confirme seu email para ativar sua conta Plim">
      <Section>
        <Text style={headingStyle}>Confirme seu email</Text>
        <Text style={paragraphStyle}>
          Olá! Obrigado por criar uma conta no Plim. Para começar a gerenciar suas finanças,
          confirme seu endereço de email clicando no botão abaixo.
        </Text>
        <Section style={buttonContainerStyle}>
          <Button href="{{.ConfirmationURL}}">Confirmar email</Button>
        </Section>
        <Text style={paragraphStyle}>
          Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
        </Text>
        <Text style={linkStyle}>
          <Link href="{{.ConfirmationURL}}" style={linkTextStyle}>
            {'{{.ConfirmationURL}}'}
          </Link>
        </Text>
        <Text style={otpStyle}>
          Ou use o código de verificação: <strong>{'{{.Token}}'}</strong>
        </Text>
        <Text style={noteStyle}>
          Este link expira em 24 horas. Se você não criou uma conta no Plim, ignore este email.
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

const buttonContainerStyle = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const linkStyle = {
  wordBreak: 'break-all' as const,
  margin: '0 0 16px 0',
}

const linkTextStyle = {
  color: '#f59e0b',
  fontSize: '14px',
}

const otpStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  color: '#334155',
  fontSize: '16px',
  margin: '24px 0',
}

const noteStyle = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0 0',
}
