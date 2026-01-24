import { Link, Section, Text } from '@react-email/components'
import { BaseLayout } from '../components/base-layout'
import { Button } from '../components/button'

export default function ChangeEmailEmail() {
  return (
    <BaseLayout preview="Confirme seu novo email no Plim">
      <Section>
        <Text style={headingStyle}>Confirmar novo email</Text>
        <Text style={paragraphStyle}>
          Recebemos uma solicitação para alterar o email da sua conta no Plim para{' '}
          <strong>{'{{.NewEmail}}'}</strong>.
        </Text>
        <Text style={paragraphStyle}>Clique no botão abaixo para confirmar esta alteração:</Text>
        <Section style={buttonContainerStyle}>
          <Button href="{{.ConfirmationURL}}">Confirmar novo email</Button>
        </Section>
        <Text style={paragraphStyle}>
          Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
        </Text>
        <Text style={linkStyle}>
          <Link href="{{.ConfirmationURL}}" style={linkTextStyle}>
            {'{{.ConfirmationURL}}'}
          </Link>
        </Text>
        <Text style={noteStyle}>
          Este link expira em 24 horas. Se você não solicitou esta alteração, por favor acesse sua
          conta imediatamente e verifique suas configurações de segurança.
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

const noteStyle = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0 0',
}
