import { cn } from '@/lib/utils'
import {
  BadgeDollarSign,
  Banknote,
  Coins,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'

interface FloatingIconProps {
  icon: React.ReactNode
  className?: string
  delay?: string
  duration?: string
}

function FloatingIcon({ icon, className, delay = '0s', duration = '4s' }: FloatingIconProps) {
  return (
    <div
      className={cn('absolute text-slate-700 opacity-20', className)}
      style={{
        animation: `float ${duration} ease-in-out infinite`,
        animationDelay: delay,
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
        duration="4s"
      />
      <FloatingIcon
        icon={<CreditCard className="h-12 w-12" />}
        className="left-[70%] top-[10%]"
        delay="0.5s"
        duration="5s"
      />
      <FloatingIcon
        icon={<PiggyBank className="h-20 w-20" />}
        className="left-[25%] top-[45%]"
        delay="1s"
        duration="6s"
      />
      <FloatingIcon
        icon={<TrendingUp className="h-14 w-14" />}
        className="left-[60%] top-[35%]"
        delay="1.5s"
        duration="4.5s"
      />
      <FloatingIcon
        icon={<Banknote className="h-10 w-10" />}
        className="left-[15%] top-[70%]"
        delay="0.3s"
        duration="5.5s"
      />
      <FloatingIcon
        icon={<Receipt className="h-12 w-12" />}
        className="left-[75%] top-[60%]"
        delay="0.8s"
        duration="4s"
      />
      <FloatingIcon
        icon={<Coins className="h-16 w-16" />}
        className="left-[45%] top-[75%]"
        delay="1.2s"
        duration="5s"
      />
      <FloatingIcon
        icon={<BadgeDollarSign className="h-14 w-14" />}
        className="left-[85%] top-[85%]"
        delay="0.6s"
        duration="6s"
      />

      {/* Branding */}
      <div className="absolute bottom-8 left-8">
        <h2 className="text-2xl font-bold text-white">MyFinances</h2>
        <p className="text-slate-400">Gerencie suas finanças com simplicidade</p>
      </div>
    </div>
  )
}
