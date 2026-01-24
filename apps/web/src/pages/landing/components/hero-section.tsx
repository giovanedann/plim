import { PlimIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
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

export function HeroSection() {
  return (
    <section className="landing-section relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      {/* Floating icons - reduced on mobile */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile floating icons - fewer, smaller */}
      <div className="md:hidden">
        <FloatingIcon
          icon={<Wallet className="h-10 w-10" />}
          className="left-[10%] top-[10%]"
          delay="0s"
          duration="12s"
          animation="orbit"
          color="text-amber-500/70"
          glowColor="#f59e0b"
        />
        <FloatingIcon
          icon={<PiggyBank className="h-12 w-12" />}
          className="right-[10%] top-[15%]"
          delay="1s"
          duration="15s"
          animation="float-wave"
          color="text-pink-500/70"
          glowColor="#ec4899"
        />
        <FloatingIcon
          icon={<Coins className="h-8 w-8" />}
          className="left-[15%] bottom-[25%]"
          delay="0.8s"
          duration="13s"
          animation="drift"
          color="text-yellow-400/80"
          glowColor="#facc15"
        />
        <FloatingIcon
          icon={<TrendingUp className="h-8 w-8" />}
          className="right-[15%] bottom-[20%]"
          delay="2s"
          duration="8s"
          animation="pulse-float"
          color="text-emerald-500/80"
          glowColor="#10b981"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Animated logo */}
        <div
          className="mb-8 drop-shadow-[0_0_40px_rgba(255,193,7,0.6)]"
          style={{
            animation: 'float-wave 6s ease-in-out infinite',
          }}
        >
          <PlimIcon className="size-24 md:size-40" />
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          Domine suas finanças pessoais
        </h1>

        {/* Subheadline */}
        <p className="mb-8 max-w-2xl text-lg text-slate-400 md:text-xl lg:text-2xl">
          Acompanhe gastos, visualize padrões e economize mais todo mês. Simples, visual e gratuito.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-amber-500 text-slate-950 hover:bg-amber-400 text-base md:text-lg px-8"
          >
            <Link to="/sign-up">Começar agora — é grátis</Link>
          </Button>
          <Link
            to="/sign-in"
            className="text-slate-400 hover:text-white transition-colors text-base md:text-lg"
          >
            Já tem conta? Entrar
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center animate-bounce">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-sm">Saiba mais</span>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
