import { Button as ReactEmailButton } from '@react-email/components'

interface ButtonProps {
  href: string
  children: React.ReactNode
}

export function Button({ href, children }: ButtonProps) {
  return (
    <ReactEmailButton href={href} style={buttonStyle}>
      {children}
    </ReactEmailButton>
  )
}

const buttonStyle = {
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '8px',
}
