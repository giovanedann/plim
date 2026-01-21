import { PlimIcon } from '@/components/icons'

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <PlimIcon className="size-8" />
            <span className="font-semibold text-foreground">Plim</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-sm text-muted-foreground md:mt-8">
          © {new Date().getFullYear()} Plim. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
