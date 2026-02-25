import { PlimIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
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
import { useMotionValue, useSpring, useTransform } from 'motion/react'
import * as motion from 'motion/react-client'
import { useCallback, useRef } from 'react'

type AnimationType = 'orbit' | 'orbit-reverse' | 'float-wave' | 'drift' | 'pulse-float' | 'swing'

interface FloatingIconProps {
  icon: React.ReactNode
  className?: string
  delay?: string
  duration?: string
  animation?: AnimationType
  color: string
  glowColor: string
  isDraggable?: boolean
}

function FloatingIcon({
  icon,
  className,
  delay = '0s',
  duration = '8s',
  animation = 'orbit',
  color,
  glowColor,
  isDraggable = false,
}: FloatingIconProps) {
  return (
    <div
      className={cn('absolute z-20', className)}
      style={{
        animation: `${animation} ${duration} ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      <motion.div
        className={cn(
          'transition-[filter] duration-300',
          color,
          isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        )}
        style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
        drag={isDraggable}
        dragConstraints={{ top: -40, right: 40, bottom: 40, left: -40 }}
        dragElastic={0.3}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        whileHover={{ scale: 1.3, filter: `drop-shadow(0 0 25px ${glowColor})` }}
        whileTap={{ scale: 1.1 }}
        whileDrag={{ scale: 1.2, filter: `drop-shadow(0 0 30px ${glowColor})` }}
      >
        {icon}
      </motion.div>
    </div>
  )
}

function InteractiveLogo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(springY, [-0.5, 0.5], ['12deg', '-12deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-12deg', '12deg'])

  const glowX = useTransform(springX, [-0.5, 0.5], ['30%', '70%'])
  const glowY = useTransform(springY, [-0.5, 0.5], ['30%', '70%'])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || prefersReducedMotion || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    },
    [isMobile, prefersReducedMotion, mouseX, mouseY]
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  if (prefersReducedMotion) {
    return (
      <div className="relative mb-8">
        <div className="absolute inset-0 m-auto h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative drop-shadow-[0_0_40px_rgba(255,193,7,0.6)]">
          <PlimIcon className="size-24 md:size-40" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative mb-8 cursor-pointer p-12"
      style={{ perspective: '800px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 m-auto h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

      <motion.div
        className="pointer-events-none absolute inset-0 m-auto h-60 w-60 rounded-full blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
          left: glowX,
          top: glowY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Breathing glow — CSS animation so it doesn't fight Motion gestures */}
      <div
        className="relative"
        style={{
          animation: 'logo-breathe 4s ease-in-out infinite',
        }}
      >
        {/* 3D tilt + gesture layer */}
        <motion.div
          style={{
            rotateX: isMobile ? 0 : rotateX,
            rotateY: isMobile ? 0 : rotateY,
            transformStyle: 'preserve-3d',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlimIcon className="size-24 md:size-40" />
        </motion.div>
      </div>
    </div>
  )
}

export function HeroSection() {
  const user = useAuthStore((state) => state.user)
  const isMobile = useIsMobile()
  const isDraggable = !isMobile

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-950">
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
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<CreditCard className="h-14 w-14" />}
          className="left-[70%] top-[12%]"
          delay="0.5s"
          duration="10s"
          animation="drift"
          color="text-purple-500/80"
          glowColor="#a855f7"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<PiggyBank className="h-20 w-20" />}
          className="left-[25%] top-[40%]"
          delay="1s"
          duration="15s"
          animation="float-wave"
          color="text-pink-500/70"
          glowColor="#ec4899"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<TrendingUp className="h-14 w-14" />}
          className="left-[65%] top-[35%]"
          delay="2s"
          duration="8s"
          animation="pulse-float"
          color="text-emerald-500/80"
          glowColor="#10b981"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<Banknote className="h-12 w-12" />}
          className="left-[15%] top-[65%]"
          delay="0.3s"
          duration="11s"
          animation="orbit-reverse"
          color="text-green-500/80"
          glowColor="#22c55e"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<Receipt className="h-12 w-12" />}
          className="left-[75%] top-[55%]"
          delay="1.5s"
          duration="9s"
          animation="swing"
          color="text-blue-400/70"
          glowColor="#60a5fa"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<Coins className="h-16 w-16" />}
          className="left-[45%] top-[70%]"
          delay="0.8s"
          duration="13s"
          animation="drift"
          color="text-yellow-400/80"
          glowColor="#facc15"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<BadgeDollarSign className="h-14 w-14" />}
          className="left-[85%] top-[80%]"
          delay="2.5s"
          duration="10s"
          animation="orbit"
          color="text-lime-500/70"
          glowColor="#84cc16"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<Wallet className="h-10 w-10" />}
          className="left-[50%] top-[20%]"
          delay="3s"
          duration="14s"
          animation="float-wave"
          color="text-orange-400/60"
          glowColor="#fb923c"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<CreditCard className="h-10 w-10" />}
          className="left-[30%] top-[75%]"
          delay="1.8s"
          duration="11s"
          animation="pulse-float"
          color="text-violet-500/60"
          glowColor="#8b5cf6"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<Coins className="h-8 w-8" />}
          className="left-[80%] top-[30%]"
          delay="0.2s"
          duration="9s"
          animation="swing"
          color="text-amber-400/60"
          glowColor="#fbbf24"
          isDraggable={isDraggable}
        />
        <FloatingIcon
          icon={<TrendingDown className="h-10 w-10" />}
          className="left-[5%] top-[45%]"
          delay="2.2s"
          duration="12s"
          animation="orbit-reverse"
          color="text-red-500/70"
          glowColor="#ef4444"
          isDraggable={isDraggable}
        />
      </div>

      {/* Mobile floating icons - fewer, smaller, not draggable */}
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

      {/* Main content — pointer-events-none so floating icons behind are reachable */}
      <div className="relative z-30 flex min-h-screen flex-col items-center justify-center px-4 text-center pointer-events-none">
        <div className="pointer-events-auto">
          <InteractiveLogo />
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent"
        >
          Domine suas finanças pessoais
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 max-w-2xl text-lg text-slate-400 md:text-xl lg:text-2xl"
        >
          Acompanhe gastos, visualize padrões e economize mais todo mês. Simples, visual e gratuito.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center gap-4 sm:flex-row pointer-events-auto"
        >
          {user ? (
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base md:text-lg px-8"
            >
              <Link to="/home" className="flex items-center gap-2">
                Acessar app
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <>
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
            </>
          )}
        </motion.div>
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
