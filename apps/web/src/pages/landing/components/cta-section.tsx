import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export function CtaSection() {
  return (
    <section className="landing-section flex min-h-[60vh] w-full items-center bg-slate-950 py-16 md:min-h-[70vh] md:py-0">
      <div className="mx-auto w-full max-w-4xl px-4 text-center md:px-8">
        {/* Headline */}
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Pronto para organizar suas finanças?
        </h2>

        {/* Subheadline */}
        <p className="mb-8 text-lg text-slate-400 md:text-xl">
          Comece agora e veja a diferença em poucos minutos.
        </p>

        {/* CTA */}
        <Button
          asChild
          size="lg"
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 text-base md:text-lg px-8"
        >
          <Link to="/sign-up">Criar conta grátis</Link>
        </Button>

        {/* Trust text */}
        <p className="mt-6 text-sm text-slate-500">Sem cartão de crédito. Cancele quando quiser.</p>
      </div>
    </section>
  )
}
