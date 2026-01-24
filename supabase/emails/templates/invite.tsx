import { Link, Section, Text } from '@react-email/components'
import { BaseLayout } from '../components/base-layout'
import { Button } from '../components/button'

export default function InviteEmail() {
  return (
    <BaseLayout preview="Você foi convidado para o Plim">
      <Section>
        <Text style={headingStyle}>Você foi convidado!</Text>
        <Text style={paragraphStyle}>
          Você recebeu um convite para criar uma conta no Plim, a forma mais simples de gerenciar
          suas finanças pessoais.
        </Text>
        <Text style={paragraphStyle}>
          Clique no botão abaixo para aceitar o convite e criar sua conta:
        </Text>
        <Section style={buttonContainerStyle}>
          <Button href="{{.ConfirmationURL}}">Aceitar convite</Button>
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
          Este convite expira em 7 dias. Se você não esperava este convite, pode ignorar este email
          com segurança.
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
