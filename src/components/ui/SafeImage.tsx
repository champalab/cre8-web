import { useEffect, useState } from 'react'
import { Camera, ImageOff, ImageIcon, Loader2, User2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SafeImageVariant = 'avatar' | 'gallery' | 'thumbnail' | 'custom'

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null
    alt?: string
    variant?: SafeImageVariant
    fallbackSrc?: string
    fallbackName?: string
    fallbackText?: string
    fallbackIcon?: React.ReactNode
    containerClassName?: string
    showSkeleton?: boolean
}

export function SafeImage({
    src,
    alt = '',
    variant = 'gallery',
    fallbackSrc,
    fallbackName,
    fallbackText,
    fallbackIcon,
    className,
    containerClassName,
    showSkeleton = true,
    onLoad,
    onError,
    ...props
}: SafeImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(!src)
    const [usingFallbackSrc, setUsingFallbackSrc] = useState(false)

    useEffect(() => {
        setHasError(!src)
        setIsLoading(Boolean(src))
        setUsingFallbackSrc(false)
    }, [src])

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false)
        onLoad?.(e)
    }

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (fallbackSrc && !usingFallbackSrc) {
            setUsingFallbackSrc(true)
            return
        }
        setIsLoading(false)
        setHasError(true)
        onError?.(e)
    }

    const currentSrc = usingFallbackSrc ? fallbackSrc : src

    if (hasError || !currentSrc) {
        if (variant === 'avatar') {
            const initial = (fallbackName || alt || '?').trim().charAt(0).toUpperCase()
            return (
                <div
                    className={cn(
                        'flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 p-2 text-slate-200 select-none',
                        containerClassName
                    )}
                >
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 shadow-inner sm:size-12">
                            {fallbackIcon || <User2 className="size-5 text-slate-400 sm:size-6" />}
                        </div>
                        {initial && initial !== '?' && (
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                                {initial}
                            </span>
                        )}
                    </div>
                </div>
            )
        }

        if (variant === 'thumbnail') {
            return (
                <div
                    className={cn(
                        'flex size-full items-center justify-center overflow-hidden rounded-md border bg-slate-900/90 p-3 text-center text-slate-400 select-none',
                        containerClassName
                    )}
                >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                        {fallbackIcon || <Camera className="size-6 text-slate-500" />}
                        <span className="text-[10px] font-medium text-slate-400/80 sm:text-xs">
                            {fallbackText || 'No Preview'}
                        </span>
                    </div>
                </div>
            )
        }

        return (
            <div
                className={cn(
                    'flex size-full items-center justify-center overflow-hidden rounded-md border bg-muted/40 p-2 text-center text-muted-foreground select-none',
                    containerClassName
                )}
            >
                <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/60">
                    {fallbackIcon || (variant === 'gallery' ? <ImageIcon className="size-5 shrink-0" /> : <ImageOff className="size-5 shrink-0" />)}
                    {fallbackText && (
                        <span className="text-[10px] font-medium leading-tight sm:text-xs">
                            {fallbackText}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={cn('relative size-full overflow-hidden', containerClassName)}>
            {isLoading && showSkeleton && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/60 animate-pulse">
                    <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
                </div>
            )}
            <img
                src={currentSrc}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                    'h-full w-full object-cover transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100',
                    className
                )}
                {...props}
            />
        </div>
    )
}

export default SafeImage
