import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  const user = useAuthStore((state) => state.user)

  return (
    <section className="relative flex w-full items-center bg-slate-950 py-16 md:py-24">
      {/* Subtle radial glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative mx-auto w-full max-w-4xl px-4 text-center md:px-8">
        {/* Headline */}
        <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
          {user ? 'Continue organizando suas finanças' : 'Pronto para organizar suas finanças?'}
        </h2>

        {/* Subheadline */}
        <p className="mb-8 text-lg text-slate-400 md:text-xl">
          {user
            ? 'Acesse seu dashboard e veja suas finanças em detalhes.'
            : 'Comece agora e veja a diferença em poucos minutos.'}
        </p>

        {/* CTA */}
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
          <Button
            asChild
            size="lg"
            className="bg-amber-500 text-slate-950 hover:bg-amber-400 text-base md:text-lg px-8"
          >
            <Link to="/sign-up">Criar conta grátis</Link>
          </Button>
        )}

        {/* Trust text */}
        {!user && (
          <p className="mt-6 text-sm text-slate-500">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        )}
      </div>
    </section>
  )
}
