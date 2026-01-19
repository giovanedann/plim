import { cn } from '@/lib/utils'
import {
  BadgeDollarSign,
  Banknote,
  Coins,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

type AnimationType = 'orbit' | 'orbit-reverse' | 'float-wave' | 'drift' | 'pulse-float' | 'swing'

interface FloatingIconProps {
  icon: React.ReactNode
  className?: string
  delay?: string
  duration?: string
  animation?: AnimationType
  color: string
  glowColor: string
}

function FloatingIcon({
  icon,
  className,
  delay = '0s',
  duration = '8s',
  animation = 'orbit',
  color,
  glowColor,
}: FloatingIconProps) {
  return (
    <div
      className={cn('absolute transition-all duration-300 cursor-pointer', color, className)}
      style={{
        animation: `${animation} ${duration} ease-in-out infinite`,
        animationDelay: delay,
        filter: 'drop-shadow(0 0 8px currentColor)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = `drop-shadow(0 0 25px ${glowColor})`
        e.currentTarget.style.transform = 'scale(1.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'drop-shadow(0 0 8px currentColor)'
        e.currentTarget.style.transform = ''
      }}
    >
      {icon}
    </div>
  )
}

export function AnimatedPanel() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-slate-950 lg:block">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      {/* Floating icons */}
      <FloatingIcon
        icon={<Wallet className="h-16 w-16" />}
        className="left-[10%] top-[15%]"
        delay="0s"
        duration="12s"
        animation="orbit"
        color="text-amber-500/70"
        glowColor="#f59e0b"
      />
      <FloatingIcon
        icon={<CreditCard className="h-14 w-14" />}
        className="left-[70%] top-[12%]"
        delay="0.5s"
        duration="10s"
        animation="drift"
        color="text-purple-500/80"
        glowColor="#a855f7"
      />
      <FloatingIcon
        icon={<PiggyBank className="h-20 w-20" />}
        className="left-[25%] top-[40%]"
        delay="1s"
        duration="15s"
        animation="float-wave"
        color="text-pink-500/70"
        glowColor="#ec4899"
      />
      <FloatingIcon
        icon={<TrendingUp className="h-14 w-14" />}
        className="left-[65%] top-[35%]"
        delay="2s"
        duration="8s"
        animation="pulse-float"
        color="text-emerald-500/80"
        glowColor="#10b981"
      />
      <FloatingIcon
        icon={<Banknote className="h-12 w-12" />}
        className="left-[15%] top-[65%]"
        delay="0.3s"
        duration="11s"
        animation="orbit-reverse"
        color="text-green-500/80"
        glowColor="#22c55e"
      />
      <FloatingIcon
        icon={<Receipt className="h-12 w-12" />}
        className="left-[75%] top-[55%]"
        delay="1.5s"
        duration="9s"
        animation="swing"
        color="text-blue-400/70"
        glowColor="#60a5fa"
      />
      <FloatingIcon
        icon={<Coins className="h-16 w-16" />}
        className="left-[45%] top-[70%]"
        delay="0.8s"
        duration="13s"
        animation="drift"
        color="text-yellow-400/80"
        glowColor="#facc15"
      />
      <FloatingIcon
        icon={<BadgeDollarSign className="h-14 w-14" />}
        className="left-[85%] top-[80%]"
        delay="2.5s"
        duration="10s"
        animation="orbit"
        color="text-lime-500/70"
        glowColor="#84cc16"
      />

      {/* Extra icons for more visual interest */}
      <FloatingIcon
        icon={<Wallet className="h-10 w-10" />}
        className="left-[50%] top-[20%]"
        delay="3s"
        duration="14s"
        animation="float-wave"
        color="text-orange-400/60"
        glowColor="#fb923c"
      />
      <FloatingIcon
        icon={<CreditCard className="h-10 w-10" />}
        className="left-[30%] top-[75%]"
        delay="1.8s"
        duration="11s"
        animation="pulse-float"
        color="text-violet-500/60"
        glowColor="#8b5cf6"
      />
      <FloatingIcon
        icon={<Coins className="h-8 w-8" />}
        className="left-[80%] top-[30%]"
        delay="0.2s"
        duration="9s"
        animation="swing"
        color="text-amber-400/60"
        glowColor="#fbbf24"
      />
      <FloatingIcon
        icon={<TrendingDown className="h-10 w-10" />}
        className="left-[5%] top-[45%]"
        delay="2.2s"
        duration="12s"
        animation="orbit-reverse"
        color="text-red-500/70"
        glowColor="#ef4444"
      />

      {/* Branding */}
      <div className="absolute bottom-8 left-8 z-10">
        <h2 className="text-2xl font-bold text-white">MyFinances</h2>
        <p className="text-slate-400">Gerencie suas finanças com simplicidade</p>
      </div>
    </div>
  )
}
