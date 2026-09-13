import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = { open: boolean; className?: string }

export default function BackdropComponent({ open, className }: Props) {
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm',
        className
      )}
    >
      <Loader2 className="size-10 animate-spin text-primary" />
    </div>
  )
}
