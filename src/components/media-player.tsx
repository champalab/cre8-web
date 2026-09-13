import React, { useEffect, useRef, useState } from 'react'
import { ExternalLink, Maximize, Minimize, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type VideoPlayerProps = {
    src: string
    mimeType?: string | null
    className?: string
}

function getFullscreenElement() {
    const doc = document as Document & { webkitFullscreenElement?: Element | null }
    return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function requestElementFullscreen(el: HTMLElement) {
    const anyEl = el as HTMLElement & {
        webkitRequestFullscreen?: () => void
        webkitEnterFullscreen?: () => void
    }
    if (el.requestFullscreen) {
        await el.requestFullscreen()
        return
    }
    if (anyEl.webkitRequestFullscreen) {
        anyEl.webkitRequestFullscreen()
        return
    }
    if (anyEl.webkitEnterFullscreen) {
        anyEl.webkitEnterFullscreen()
    }
}

async function exitElementFullscreen() {
    const doc = document as Document & { webkitExitFullscreen?: () => void }
    if (document.exitFullscreen && getFullscreenElement()) {
        await document.exitFullscreen()
        return
    }
    if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen()
    }
}

function sourceTypeForBrowser(mimeType?: string | null) {
    const mime = (mimeType || '').toLowerCase()
    // Only hint types browsers reliably advertise; omitting type lets the browser probe bytes.
    if (mime === 'video/mp4' || mime === 'video/webm' || mime.startsWith('image/')) return mime
    return undefined
}

function isLikelyQuickTime(src: string, mimeType?: string | null) {
    const mime = (mimeType || '').toLowerCase()
    if (mime.includes('quicktime')) return true
    return /\.mov(\?|#|$)/i.test(src)
}

function mediaErrorMessage(code?: number, isQuickTime?: boolean) {
    if (isQuickTime) {
        return 'This .mov file may not play in this browser. Open it in a new tab or upload MP4 (H.264) for best compatibility.'
    }
    if (code === 4) return 'Video format is not supported by this browser.'
    if (code === 2) return 'Network error while loading the video.'
    if (code === 3) return 'Video file appears to be corrupted or incomplete.'
    return 'Unable to play this video.'
}

export function VideoPlayer({ src, mimeType, className }: VideoPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const quickTime = isLikelyQuickTime(src, mimeType)

    useEffect(() => {
        setError(null)
    }, [src, reloadKey])

    useEffect(() => {
        const sync = () => {
            const active = getFullscreenElement()
            setIsFullscreen(
                Boolean(
                    active &&
                        (active === containerRef.current || active === videoRef.current)
                )
            )
        }
        document.addEventListener('fullscreenchange', sync)
        document.addEventListener('webkitfullscreenchange', sync)
        return () => {
            document.removeEventListener('fullscreenchange', sync)
            document.removeEventListener('webkitfullscreenchange', sync)
        }
    }, [])

    const toggleFullscreen = async (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        const container = containerRef.current
        const video = videoRef.current
        if (!container || !video) return

        try {
            if (getFullscreenElement()) {
                await exitElementFullscreen()
                return
            }
            await requestElementFullscreen(video)
        } catch {
            const iosVideo = video as HTMLVideoElement & {
                webkitEnterFullscreen?: () => void
            }
            if (iosVideo.webkitEnterFullscreen) {
                iosVideo.webkitEnterFullscreen()
            } else {
                await requestElementFullscreen(container)
            }
        }
    }

    return (
        <div ref={containerRef} className={cn('space-y-2', className)}>
            {/*
              No overlays on top of <video> — they steal clicks from native play controls.
              preload=metadata keeps review dialogs fast; Range requests handle seeking.
            */}
            <video
                key={`${src}:${reloadKey}`}
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                className={cn(
                    'relative z-10 w-full rounded-lg bg-black object-contain',
                    isFullscreen ? 'max-h-screen' : 'max-h-80'
                )}
                onLoadedData={() => setError(null)}
                onError={() => {
                    const code = videoRef.current?.error?.code
                    setError(mediaErrorMessage(code, quickTime))
                }}
            >
                <source src={src} type={sourceTypeForBrowser(mimeType)} />
            </video>

            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <p>{error}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setReloadKey((value) => value + 1)}
                        >
                            <RefreshCw className="size-4" />
                            Retry
                        </Button>
                        <Button type="button" size="sm" variant="outline" asChild>
                            <a href={src} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-4" />
                                Open video
                            </a>
                        </Button>
                    </div>
                </div>
            )}

            {!error && quickTime && (
                <p className="text-xs text-muted-foreground">
                    .mov files play best in Safari. Prefer MP4 (H.264) for Chrome/Firefox.
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" size="sm" variant="outline" asChild>
                    <a href={src} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Open
                    </a>
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={toggleFullscreen}>
                    {isFullscreen ? (
                        <>
                            <Minimize className="size-4" />
                            Exit fullscreen
                        </>
                    ) : (
                        <>
                            <Maximize className="size-4" />
                            Fullscreen
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

type MediaPreviewProps = {
    url: string
    isVideo: boolean
    mimeType?: string | null
    alt?: string
    className?: string
}

export function resolveMediaUrl(media: {
    media_url?: string | null
    stored_files?: { public_url?: string | null; mime_type?: string | null } | null
}) {
    return media.media_url || media.stored_files?.public_url || null
}

export function resolveMediaMimeType(media: {
    mime_type?: string | null
    stored_files?: { mime_type?: string | null } | null
}) {
    return media.mime_type || media.stored_files?.mime_type || null
}

export function MediaPreview({ url, isVideo, mimeType, alt = '', className }: MediaPreviewProps) {
    if (isVideo) {
        return <VideoPlayer src={url} mimeType={mimeType} className={className} />
    }

    return (
        <img
            src={url}
            alt={alt}
            loading="lazy"
            className={cn('max-h-80 w-full rounded-lg object-contain', className)}
        />
    )
}
