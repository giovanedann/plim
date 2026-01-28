import { Button } from '@/components/ui/button'
import type { PaginationMeta } from '@plim/shared'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function PaginationControls({ meta, onPageChange, isLoading }: PaginationControlsProps) {
  const { page, totalPages } = meta

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Pagina {page} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || isLoading}
      >
        Proxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
