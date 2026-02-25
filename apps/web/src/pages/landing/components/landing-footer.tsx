import { PlimIcon } from '@/components/icons'
import { Link } from '@tanstack/react-router'

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <PlimIcon className="size-8" />
            <span className="font-semibold text-white">Plim</span>
          </div>

          {/* Legal Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Política de Privacidade
            </Link>
            <Link to="/terms" className="text-sm text-slate-400 transition-colors hover:text-white">
              Termos de Uso
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-slate-400 md:mt-8">
          © {new Date().getFullYear()} Plim. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
