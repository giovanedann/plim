import { PlimIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { AlertTriangle, ArrowLeft, Compass, Home, MapPin, Search, Signpost } from 'lucide-react'
import { Link } from 'react-router'

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

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Floating icons - navigation/lost theme */}
      <FloatingIcon
        icon={<Compass className="h-16 w-16" />}
        className="left-[8%] top-[12%]"
        delay="0s"
        duration="12s"
        animation="orbit"
        color="text-amber-500/70"
        glowColor="#f59e0b"
      />
      <FloatingIcon
        icon={<MapPin className="h-14 w-14" />}
        className="left-[72%] top-[10%]"
        delay="0.5s"
        duration="10s"
        animation="drift"
        color="text-red-500/80"
        glowColor="#ef4444"
      />
      <FloatingIcon
        icon={<Search className="h-20 w-20" />}
        className="left-[20%] top-[35%]"
        delay="1s"
        duration="15s"
        animation="float-wave"
        color="text-blue-500/70"
        glowColor="#3b82f6"
      />
      <FloatingIcon
        icon={<AlertTriangle className="h-14 w-14" />}
        className="left-[68%] top-[30%]"
        delay="2s"
        duration="8s"
        animation="pulse-float"
        color="text-yellow-500/80"
        glowColor="#eab308"
      />
      <FloatingIcon
        icon={<Signpost className="h-12 w-12" />}
        className="left-[12%] top-[65%]"
        delay="0.3s"
        duration="11s"
        animation="orbit-reverse"
        color="text-purple-500/80"
        glowColor="#a855f7"
      />
      <FloatingIcon
        icon={<Home className="h-12 w-12" />}
        className="left-[78%] top-[55%]"
        delay="1.5s"
        duration="9s"
        animation="swing"
        color="text-emerald-400/70"
        glowColor="#34d399"
      />
      <FloatingIcon
        icon={<Compass className="h-10 w-10" />}
        className="left-[45%] top-[72%]"
        delay="0.8s"
        duration="13s"
        animation="drift"
        color="text-cyan-400/80"
        glowColor="#22d3ee"
      />
      <FloatingIcon
        icon={<MapPin className="h-10 w-10" />}
        className="left-[88%] top-[78%]"
        delay="2.5s"
        duration="10s"
        animation="orbit"
        color="text-orange-500/70"
        glowColor="#f97316"
      />

      {/* Extra floating icons for visual depth */}
      <FloatingIcon
        icon={<Search className="h-8 w-8" />}
        className="left-[55%] top-[18%]"
        delay="3s"
        duration="14s"
        animation="float-wave"
        color="text-sky-400/60"
        glowColor="#38bdf8"
      />
      <FloatingIcon
        icon={<Signpost className="h-10 w-10" />}
        className="left-[32%] top-[78%]"
        delay="1.8s"
        duration="11s"
        animation="pulse-float"
        color="text-violet-500/60"
        glowColor="#8b5cf6"
      />
      <FloatingIcon
        icon={<AlertTriangle className="h-8 w-8" />}
        className="left-[82%] top-[25%]"
        delay="0.2s"
        duration="9s"
        animation="swing"
        color="text-rose-400/60"
        glowColor="#fb7185"
      />
      <FloatingIcon
        icon={<Home className="h-10 w-10" />}
        className="left-[5%] top-[42%]"
        delay="2.2s"
        duration="12s"
        animation="orbit-reverse"
        color="text-teal-500/70"
        glowColor="#14b8a6"
      />

      {/* Centered content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-4 text-center">
          {/* Animated logo */}
          <div
            className="drop-shadow-[0_0_30px_rgba(255,193,7,0.5)]"
            style={{
              animation: 'float-wave 6s ease-in-out infinite',
            }}
          >
            <PlimIcon className="size-24 md:size-32" />
          </div>

          {/* 404 number with glow effect */}
          <h1
            className="text-8xl font-black text-white md:text-9xl"
            style={{
              textShadow: '0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(255, 255, 255, 0.1)',
            }}
          >
            404
          </h1>

          {/* Message */}
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Página não encontrada</h2>
            <p className="text-slate-400">
              Parece que você se perdeu. A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                Ir para Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 hover:text-white"
            >
              <Link to="/" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
