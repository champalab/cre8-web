import React, { useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, ZoomIn, ZoomOut, Download, ExternalLink, Loader2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface ImagePreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    src?: string | null
    alt?: string
    title?: string
    subtitle?: string
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
    open,
    onOpenChange,
    src,
    alt,
    title,
    subtitle
}) => {
    const { t } = useTranslation('app')
    const [isZoomed, setIsZoomed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        if (open) {
            setIsZoomed(false)
            setIsLoading(true)
            setHasError(false)
        }
    }, [open, src])

    const handleDownload = async () => {
        if (!src) return
        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `${title ? title.replace(/\s+/g, '_') : 'image'}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch {
            window.open(src, '_blank')
        }
    }

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(95vw,56rem)] max-h-[92vh] flex flex-col rounded-3xl bg-slate-900/95 text-white border border-slate-800 shadow-2xl overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
                    data-html2canvas-ignore="true"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <DialogPrimitive.Title className="text-base sm:text-lg font-bold text-white truncate font-lao">
                                    {title || alt || t('publicCampaign.previewImage', 'ເບິ່ງຮູບຂະໜາດໃຫຍ່')}
                                </DialogPrimitive.Title>
                                {subtitle && (
                                    <p className="text-xs text-slate-400 truncate font-mono">
                                        {subtitle}
                                    </p>
                                )}
                                <DialogPrimitive.Description className="sr-only">
                                    {title || alt || 'Image Preview'}
                                </DialogPrimitive.Description>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsZoomed((prev) => !prev)}
                                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                                title={isZoomed ? t('publicCampaign.zoomOut', 'ຊູມອອກ') : t('publicCampaign.zoomIn', 'ຊູມເຂົ້າ')}
                            >
                                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                                <span className="hidden sm:inline font-lao">
                                    {isZoomed ? t('publicCampaign.zoomOut', 'ຊູມອອກ') : t('publicCampaign.zoomIn', 'ຊູມເຂົ້າ')}
                                </span>
                            </button>

                            {src && (
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                                    title={t('publicCampaign.download', 'ດາວໂຫຼດ')}
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline font-lao">{t('publicCampaign.download', 'ດາວໂຫຼດ')}</span>
                                </button>
                            )}

                            {src && (
                                <a
                                    href={src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                    title={t('publicCampaign.openOriginal', 'ເປີດຮູບຕົ້ນສະບັບ')}
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}

                            <DialogPrimitive.Close
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                                title={t('publicCampaign.close', 'ປິດ')}
                            >
                                <X className="w-5 h-5" />
                            </DialogPrimitive.Close>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="relative flex-1 min-h-[300px] max-h-[75vh] overflow-auto flex items-center justify-center p-4 sm:p-6 bg-slate-950/50">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                <span className="text-xs font-lao">{t('publicCampaign.updating', 'ກຳລັງໂຫຼດ...')}</span>
                            </div>
                        )}

                        {hasError ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                                    <X className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-lao">{t('publicCampaign.failedToLoad', 'ໂຫຼດຮູບບໍ່ສຳເລັດ')}</p>
                            </div>
                        ) : src ? (
                            <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
                                <img
                                    src={src}
                                    alt={alt || title || 'Enlarged photo'}
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => {
                                        setIsLoading(false)
                                        setHasError(true)
                                    }}
                                    onClick={() => setIsZoomed((prev) => !prev)}
                                    className={cn(
                                        'transition-all duration-300 rounded-2xl select-none',
                                        isZoomed
                                            ? 'cursor-zoom-out max-h-none max-w-none scale-125 sm:scale-150 origin-center my-8'
                                            : 'cursor-zoom-in max-h-[70vh] max-w-full object-contain shadow-2xl hover:brightness-105',
                                        isLoading ? 'opacity-0' : 'opacity-100'
                                    )}
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between font-lao">
                        <span>{t('publicCampaign.escToClose', 'ກົດ ESC ຫຼື ຄລິກພາຍນອກເພື່ອປິດ')}</span>
                        <span className="text-slate-500 hidden sm:inline">Cre8 Media</span>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
