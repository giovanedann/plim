import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import type { PaginationMeta } from '@plim/shared'

interface PaginationControlsProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  isLoading?: boolean
}

type PageItem = { type: 'page'; page: number } | { type: 'ellipsis'; position: 'start' | 'end' }

function generatePageNumbers(currentPage: number, totalPages: number): PageItem[] {
  const pages: PageItem[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ type: 'page', page: i })
    }
    return pages
  }

  pages.push({ type: 'page', page: 1 })

  if (currentPage <= 3) {
    pages.push(
      { type: 'page', page: 2 },
      { type: 'page', page: 3 },
      { type: 'page', page: 4 },
      { type: 'ellipsis', position: 'end' },
      { type: 'page', page: totalPages }
    )
  } else if (currentPage >= totalPages - 2) {
    pages.push(
      { type: 'ellipsis', position: 'start' },
      { type: 'page', page: totalPages - 3 },
      { type: 'page', page: totalPages - 2 },
      { type: 'page', page: totalPages - 1 },
      { type: 'page', page: totalPages }
    )
  } else {
    pages.push(
      { type: 'ellipsis', position: 'start' },
      { type: 'page', page: currentPage - 1 },
      { type: 'page', page: currentPage },
      { type: 'page', page: currentPage + 1 },
      { type: 'ellipsis', position: 'end' },
      { type: 'page', page: totalPages }
    )
  }

  return pages
}

export function PaginationControls({ meta, onPageChange, isLoading }: PaginationControlsProps) {
  const { page, totalPages } = meta

  if (totalPages <= 1) return null

  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <Pagination className="py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(page - 1)}
            className={cn(
              'cursor-pointer select-none',
              (page <= 1 || isLoading) && 'pointer-events-none opacity-50'
            )}
            aria-disabled={page <= 1 || isLoading}
          />
        </PaginationItem>

        {pageNumbers.map((item) =>
          item.type === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${item.position}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item.page}>
              <PaginationLink
                onClick={() => onPageChange(item.page)}
                isActive={item.page === page}
                className={cn(
                  'cursor-pointer select-none',
                  isLoading && 'pointer-events-none opacity-50'
                )}
                aria-disabled={isLoading}
              >
                {item.page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(page + 1)}
            className={cn(
              'cursor-pointer select-none',
              (page >= totalPages || isLoading) && 'pointer-events-none opacity-50'
            )}
            aria-disabled={page >= totalPages || isLoading}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
