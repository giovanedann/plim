import type { CardBank, CardColor, CardFlag } from '@plim/shared'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'

const COLOR_MAP: Record<CardColor, { bg: string; text: string }> = {
  black: { bg: 'bg-gradient-to-br from-zinc-800 to-zinc-950', text: 'text-white' },
  dark_blue: { bg: 'bg-gradient-to-br from-blue-800 to-blue-950', text: 'text-white' },
  yellow: { bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', text: 'text-zinc-900' },
  red: { bg: 'bg-gradient-to-br from-red-500 to-red-700', text: 'text-white' },
  orange: { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-white' },
  light_purple: { bg: 'bg-gradient-to-br from-purple-400 to-purple-600', text: 'text-white' },
  neon_green: { bg: 'bg-gradient-to-br from-green-400 to-emerald-500', text: 'text-zinc-900' },
  neon_blue: { bg: 'bg-gradient-to-br from-cyan-400 to-blue-500', text: 'text-white' },
  white: { bg: 'bg-gradient-to-br from-zinc-100 to-zinc-200', text: 'text-zinc-900' },
  silver: { bg: 'bg-gradient-to-br from-zinc-300 to-zinc-500', text: 'text-zinc-900' },
  gold: { bg: 'bg-gradient-to-br from-amber-300 to-yellow-600', text: 'text-zinc-900' },
  rose_gold: { bg: 'bg-gradient-to-br from-rose-300 to-rose-500', text: 'text-zinc-900' },
}

const FLAG_DISPLAY: Record<CardFlag, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  elo: 'Elo',
  american_express: 'Amex',
  hipercard: 'Hipercard',
  diners: 'Diners',
  other: '',
}

const BANK_DISPLAY: Record<CardBank, string> = {
  nubank: 'Nubank',
  inter: 'Inter',
  c6_bank: 'C6 Bank',
  itau: 'Itaú',
  bradesco: 'Bradesco',
  santander: 'Santander',
  banco_do_brasil: 'BB',
  caixa: 'Caixa',
  original: 'Original',
  neon: 'Neon',
  next: 'Next',
  picpay: 'PicPay',
  mercado_pago: 'Mercado Pago',
  other: '',
}

interface CreditCard3DProps {
  name: string
  color: CardColor
  flag: CardFlag
  bank: CardBank
  last4Digits?: string | null
  isInteractive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CreditCard3D({
  name,
  color,
  flag,
  bank,
  last4Digits,
  isInteractive = true,
  size = 'md',
}: CreditCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 50 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 50 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['17.5deg', '-17.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-17.5deg', '17.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const colorStyles = COLOR_MAP[color]
  const sizeClasses = {
    sm: 'w-48 h-28',
    md: 'w-72 h-44',
    lg: 'w-96 h-56',
  }

  return (
    <div className="perspective-1000" style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isInteractive ? rotateX : 0,
          rotateY: isInteractive ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        whileHover={isInteractive ? { scale: 1.02 } : undefined}
        className={`
          ${sizeClasses[size]}
          ${colorStyles.bg}
          ${colorStyles.text}
          relative rounded-xl p-4 shadow-xl
          cursor-pointer select-none
          transition-shadow duration-300
          hover:shadow-2xl
        `}
      >
        {/* Chip */}
        <div
          className="absolute left-4 top-6 h-8 w-10 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80"
          style={{ transform: 'translateZ(2px)' }}
        />

        {/* Bank logo */}
        <div
          className="absolute right-4 top-4 text-xs font-bold opacity-80"
          style={{ transform: 'translateZ(4px)' }}
        >
          {BANK_DISPLAY[bank]}
        </div>

        {/* Card number placeholder */}
        <div
          className="absolute bottom-14 left-4 font-mono text-lg tracking-wider opacity-90"
          style={{ transform: 'translateZ(3px)' }}
        >
          •••• •••• •••• {last4Digits || '••••'}
        </div>

        {/* Card name and Flag - bottom row */}
        <div
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between"
          style={{ transform: 'translateZ(2px)' }}
        >
          <span
            className="max-w-[60%] truncate text-xs font-medium uppercase tracking-wider opacity-80"
            title={name}
          >
            {name || 'SEU NOME'}
          </span>
          <span className="text-sm font-bold opacity-90">{FLAG_DISPLAY[flag]}</span>
        </div>

        {/* Shine effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.2) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.2) 55%, transparent 60%)',
            transform: 'translateZ(5px)',
          }}
        />
      </motion.div>
    </div>
  )
}
