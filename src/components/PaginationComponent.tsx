import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ResPagination {
  totalItems: number
  totalPages: number
}

interface Props {
  setPage: Dispatch<SetStateAction<number>>
  total: ResPagination
  page: number
  className?: string
}

const PaginationComponent = ({ page, setPage, total, className }: Props) => {
  const totalPages = Math.max(total.totalPages, 1)

  return (
    <div className={cn('my-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start', className)}>
      <div className="flex max-w-full items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex"
          disabled={page <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[5rem] px-1 text-center text-sm text-muted-foreground sm:min-w-[6rem] sm:px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:inline-flex"
          disabled={page >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {(total?.totalItems ?? 0).toLocaleString()} total items
      </p>
    </div>
  )
}

export default PaginationComponent
