import { Section } from '@react-email/components'

export function Logo() {
  return (
    <Section style={containerStyle}>
      <span style={textStyle}>Plim</span>
    </Section>
  )
}

const containerStyle = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const textStyle = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#f59e0b',
  fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}
