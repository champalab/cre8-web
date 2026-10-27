import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface ResPagination {
  totalItems: number
  totalPages: number
}

interface Props {
  setPage: Dispatch<SetStateAction<number>> | ((page: number | ((prev: number) => number)) => void)
  total: ResPagination
  page: number
  className?: string
  showTotal?: boolean
}

/**
 * Computes the visible page numbers with smart ellipsis.
 * e.g., [1, 2, 3, 4, 5, 'ellipsis-right', 20] or [1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 20]
 */
function getPageItems(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages]
}

const PaginationComponent = ({ page, setPage, total, className, showTotal = true }: Props) => {
  const { i18n } = useTranslation()
  const isLao = i18n.language?.startsWith('lo')

  const totalPages = Math.max(total?.totalPages ?? 1, 1)
  const totalItems = total?.totalItems ?? 0
  const currentPage = Math.min(Math.max(page, 1), totalPages)

  const pageItems = useMemo(() => getPageItems(currentPage, totalPages), [currentPage, totalPages])

  const handlePageChange = (target: number | ((prev: number) => number)) => {
    if (typeof target === 'function') {
      setPage(target)
    } else {
      const safe = Math.min(Math.max(target, 1), totalPages)
      setPage(safe)
    }
  }

  return (
    <div
      role="navigation"
      aria-label="Pagination"
      className={cn(
        'my-4 flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4',
        className
      )}
    >
      {/* Left side: Total counts & page status summary */}
      {showTotal && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
          <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 font-semibold tabular-nums text-foreground">
            {totalItems.toLocaleString()}
          </span>
          <span>{isLao ? 'ລາຍການທັງໝົດ' : 'total items'}</span>
          {totalPages > 1 && (
            <>
              <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden="true">
                •
              </span>
              <span className="hidden tabular-nums sm:inline">
                {isLao
                  ? `ໜ້າທີ ${currentPage} ຈາກ ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Right side: Modern Segmented Pagination Controls */}
      <div className="flex max-w-full items-center gap-1 rounded-xl border border-border/60 bg-background/90 p-1 shadow-xs backdrop-blur-xs">
        {/* First Page (hidden on smallest screens) */}
        <button
          type="button"
          aria-label={isLao ? 'ໜ້າທຳອິດ' : 'First page'}
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(1)}
          className={cn(
            'hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all sm:inline-flex',
            'hover:bg-muted/80 hover:text-foreground active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-30'
          )}
        >
          <ChevronsLeft className="size-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          aria-label={isLao ? 'ໜ້າກ່ອນໜ້າ' : 'Previous page'}
          disabled={currentPage <= 1}
          onClick={() => handlePageChange((p) => Math.max(1, p - 1))}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all',
            'hover:bg-muted/80 hover:text-foreground active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-30'
          )}
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Mobile-only compact indicator: Page X of Y */}
        <div className="flex min-w-[5.5rem] items-center justify-center px-2 text-center text-xs font-medium tabular-nums text-foreground sm:hidden">
          {currentPage} / {totalPages}
        </div>

        {/* Desktop / Tablet page number buttons */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item, index) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={`${item}-${index}`}
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center text-xs tracking-widest text-muted-foreground/60 select-none"
                >
                  •••
                </span>
              )
            }

            const isActive = item === currentPage

            return (
              <button
                key={item}
                type="button"
                aria-label={isLao ? `ໜ້າທີ ${item}` : `Page ${item}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handlePageChange(item)}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95'
                )}
              >
                {item}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          aria-label={isLao ? 'ໜ້າຖັດໄປ' : 'Next page'}
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange((p) => Math.min(totalPages, p + 1))}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all',
            'hover:bg-muted/80 hover:text-foreground active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-30'
          )}
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Last Page (hidden on smallest screens) */}
        <button
          type="button"
          aria-label={isLao ? 'ໜ້າສຸດທ້າຍ' : 'Last page'}
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={cn(
            'hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all sm:inline-flex',
            'hover:bg-muted/80 hover:text-foreground active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-30'
          )}
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default PaginationComponent
