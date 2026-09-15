import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    KeyRound,
    Loader2,
    Sparkles,
    Zap,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import ToastComponent from '@/components/ToastComponent'

export type CookieDiagnosis = {
    valid: boolean
    sanitizedCookie?: string
    userId?: string
    errorStep?: 1 | 2 | 3 | 4
    errorKey?: string
    customErrorMessage?: string
}

export function diagnoseAndNormalizeCookies(raw: string): CookieDiagnosis {
    const trimmed = (raw || '').trim()
    if (!trimmed) {
        return {
            valid: false,
            errorStep: 4,
            errorKey: 'platforms.cookieErrorStep4Empty',
        }
    }

    // Check if user pasted a link instead of cookies
    if (/^(https?:\/\/|www\.|facebook\.com)/i.test(trimmed) && !trimmed.includes(';')) {
        return {
            valid: false,
            errorStep: 2,
            errorKey: 'platforms.cookieErrorStep2NotCookie',
        }
    }

    let cookieStr = trimmed

    // Detect Cookie-Editor JSON format: [{"name":"...","value":"..."}, ...]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed) && parsed.length > 0) {
                const pairs = parsed
                    .filter(
                        (item: any) =>
                            item &&
                            typeof item.name === 'string' &&
                            typeof item.value === 'string'
                    )
                    .map((item: any) => `${item.name}=${item.value}`)
                if (pairs.length > 0) {
                    cookieStr = pairs.join('; ')
                }
            }
        } catch {
            // Keep original string if JSON parsing fails
        }
    }

    // Strip "Cookie: " HTTP header prefix if copied directly from Network request headers
    if (cookieStr.toLowerCase().startsWith('cookie:')) {
        cookieStr = cookieStr.substring(7).trim()
    }

    // Detect DevTools Application Cookies table copy (tab-separated lines)
    if (!cookieStr.includes(';') && (cookieStr.includes('\n') || cookieStr.includes('\t'))) {
        const lines = cookieStr.split(/\r?\n/)
        const pairs: string[] = []
        for (const line of lines) {
            const parts = line.split('\t')
            if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
                pairs.push(`${parts[0].trim()}=${parts[1].trim()}`)
            }
        }
        if (pairs.length > 0) {
            cookieStr = pairs.join('; ')
        }
    }

    // Step 1 check: c_user (Facebook User ID)
    const cUserMatch = cookieStr.match(/(?:^|;\s*)c_user=(\d+)/)
    if (!cUserMatch) {
        return {
            valid: false,
            errorStep: 1,
            errorKey: 'platforms.cookieErrorStep1NotLoggedIn',
        }
    }

    const userId = cUserMatch[1]

    // Step 3 check: xs session token
    const xsMatch = cookieStr.match(/(?:^|;\s*)xs=([^;]+)/)
    if (!xsMatch || !xsMatch[1].trim()) {
        return {
            valid: false,
            errorStep: 3,
            errorKey: 'platforms.cookieErrorStep3MissingXs',
            userId,
        }
    }

    return {
        valid: true,
        sanitizedCookie: cookieStr,
        userId,
    }
}

interface FacebookConnectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConnect: (cookieString: string) => Promise<void>
    loading?: boolean
}

export const FacebookConnectModal: React.FC<FacebookConnectModalProps> = ({
    open,
    onOpenChange,
    onConnect,
    loading = false,
}) => {
    const { t } = useTranslation(['app', 'common'])
    const [extensionInstalled, setExtensionInstalled] = useState(false)
    const [extensionSyncing, setExtensionSyncing] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [activeError, setActiveError] = useState<{
        step?: 1 | 2 | 3 | 4
        message: string
    } | null>(null)

    // Detect Cre8 Chrome Extension via window.postMessage ping
    useEffect(() => {
        if (!open) return

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window || !event.data) return
            if (
                event.data.type === 'CRE8_EXTENSION_INSTALLED' ||
                event.data.type === 'CRE8_PONG'
            ) {
                setExtensionInstalled(true)
            }
        }

        window.addEventListener('message', handleMessage)
        window.postMessage({ type: 'CRE8_PING' }, '*')

        const t1 = setTimeout(() => window.postMessage({ type: 'CRE8_PING' }, '*'), 300)
        const t2 = setTimeout(() => window.postMessage({ type: 'CRE8_PING' }, '*'), 1000)

        return () => {
            window.removeEventListener('message', handleMessage)
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [open])

    const handleOneClickSync = () => {
        setExtensionSyncing(true)
        setActiveError(null)

        const requestId = Math.random().toString(36).substring(2, 9)

        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', handleResponse)
            setExtensionSyncing(false)
            setActiveError({
                message: `${t('platforms.cookieConnectError')}: Extension timeout`,
            })
        }, 8000)

        const handleResponse = async (event: MessageEvent) => {
            if (event.source !== window || !event.data) return
            if (
                event.data.type === 'CRE8_RESPONSE_FB_COOKIES' &&
                event.data.requestId === requestId
            ) {
                window.removeEventListener('message', handleResponse)
                clearTimeout(timeoutId)

                const res = event.data.result
                if (res?.success && res.cookieString) {
                    try {
                        await onConnect(res.cookieString)
                        setExtensionSyncing(false)
                        ToastComponent({
                            status: 'success',
                            message: t('platforms.extensionSyncSuccess'),
                        })
                        onOpenChange(false)
                    } catch (err: any) {
                        setExtensionSyncing(false)
                        setActiveError({
                            message: `${t('platforms.cookieConnectError')}: ${
                                err?.data?.message || err?.message || ''
                            }`,
                        })
                    }
                } else {
                    setExtensionSyncing(false)
                    if (res?.error === 'NOT_LOGGED_IN') {
                        setActiveError({
                            step: 1,
                            message: t('platforms.extensionErrorNotLoggedIn'),
                        })
                    } else {
                        setActiveError({
                            message: `${t('platforms.cookieConnectError')}: ${
                                res?.message || ''
                            }`,
                        })
                    }
                }
            }
        }

        window.addEventListener('message', handleResponse)
        window.postMessage({ type: 'CRE8_REQUEST_FB_COOKIES', requestId }, '*')
    }

    const handleOpenFacebook = () => {
        window.open('https://www.facebook.com', '_blank', 'noopener,noreferrer')
    }

    const handleCopyChromeExtensions = async () => {
        try {
            await navigator.clipboard.writeText('chrome://extensions')
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2500)
            ToastComponent({
                status: 'success',
                message: t('platforms.chromeExtensionsCopied'),
            })
        } catch {
            // fallback
        }
    }

    const handleClose = () => {
        if (loading || extensionSyncing) return
        setActiveError(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <KeyRound className="size-5 text-primary" />
                        {t('platforms.cookieDialogTitle')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {t('platforms.cookieDialogDesc')}
                    </DialogDescription>
                </DialogHeader>

                {/* Diagnostic Error Banner */}
                {activeError && (
                    <Alert variant="destructive" className="border-destructive/60 bg-destructive/10">
                        <AlertCircle className="size-5 text-destructive" />
                        <AlertTitle className="font-semibold text-destructive">
                            {t('common:error')}
                        </AlertTitle>
                        <AlertDescription className="text-sm mt-1 leading-relaxed text-destructive/90 font-medium">
                            {activeError.message}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Extension Flow */}
                <div className="space-y-4 pt-1">
                    {extensionInstalled ? (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-emerald-600 text-white gap-1.5 text-xs">
                                    <CheckCircle2 className="size-3.5" />
                                    {t('platforms.extensionDetected')}
                                </Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleOpenFacebook}
                                    className="text-xs gap-1 h-7"
                                >
                                    <ExternalLink className="size-3.5" />
                                    {t('platforms.cookieOpenFacebook')}
                                </Button>
                            </div>

                            <p className="text-sm text-foreground/90 leading-relaxed">
                                {t('platforms.extensionOneClickDesc')}
                            </p>

                            <Button
                                type="button"
                                size="lg"
                                className="w-full h-12 text-base font-semibold shadow-lg gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                onClick={handleOneClickSync}
                                disabled={extensionSyncing || loading}
                            >
                                {extensionSyncing ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        {t('platforms.extensionSyncing')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-5 text-amber-300" />
                                        {t('platforms.extensionOneClickBtn')}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
                                        <Zap className="size-3.5 text-amber-500" />
                                        {t('platforms.extensionNotDetected')}
                                    </Badge>
                                    <a
                                        href="https://chromewebstore.google.com/detail/cre8-facebook-sync/maecjojlbcdnchjmackkbingdmnlblob?authuser=0&hl=th"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors shadow-sm"
                                    >
                                        <Sparkles className="size-3.5 text-amber-300" />
                                        {t('platforms.extensionStoreBtn')}
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </div>

                                <div className="text-xs space-y-2.5 text-muted-foreground pt-1">
                                    <p className="font-semibold text-foreground text-sm">
                                        {t('platforms.extensionInstallTitle')}
                                    </p>
                                    <div className="space-y-2 pl-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{t('platforms.extensionInstallStep1')}</span>
                                            <a
                                                href="https://chromewebstore.google.com/detail/cre8-facebook-sync/maecjojlbcdnchjmackkbingdmnlblob?authuser=0&hl=th"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                                            >
                                                Chrome Web Store <ExternalLink className="size-3" />
                                            </a>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>{t('platforms.extensionInstallStep2')}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleOpenFacebook}
                                                className="h-6 px-1.5 text-xs gap-1 text-primary hover:text-primary shrink-0"
                                            >
                                                <ExternalLink className="size-3" />
                                                {t('platforms.cookieOpenFacebook')}
                                            </Button>
                                        </div>
                                        <p>{t('platforms.extensionInstallStep3')}</p>
                                    </div>

                                    {/* Fallback ZIP Option */}
                                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-muted-foreground text-[11px]">
                                            {t('platforms.extensionZipOptionTitle')}
                                        </span>
                                        <a
                                            href="/cre8-extension.zip"
                                            download="cre8-extension.zip"
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
                                        >
                                            <Download className="size-3" />
                                            {t('platforms.extensionDownloadZipBtn')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading || extensionSyncing}
                    >
                        {t('common:cancel')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
