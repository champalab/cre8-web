import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    Loader2,
    RefreshCw,
    Sparkles,
    Unplug,
    Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ToastComponent from '@/components/ToastComponent'
import { formatDateTime } from '@/utils/datetime'
import type { FacebookScrapeStatus } from '../../../../stores/services/facebookScrapeApi'

interface FacebookViewerCardProps {
    scrape?: FacebookScrapeStatus
    canManage: boolean
    onConnect: (cookieString: string) => Promise<void>
    onRefresh: () => Promise<void>
    onDisconnect: () => Promise<void>
    connecting?: boolean
    refreshing?: boolean
    disconnecting?: boolean
}

export const FacebookViewerCard: React.FC<FacebookViewerCardProps> = ({
    scrape,
    canManage,
    onConnect,
    onRefresh,
    onDisconnect,
    connecting = false,
    refreshing = false,
    disconnecting = false,
}) => {
    const { t } = useTranslation(['app', 'common'])
    const [extensionInstalled, setExtensionInstalled] = useState(false)
    const [extensionSyncing, setExtensionSyncing] = useState(false)
    const [checkingExtension, setCheckingExtension] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [activeError, setActiveError] = useState<string | null>(null)
    const extensionInstalledRef = useRef(false)

    // Detect Cre8 Chrome Extension via window.postMessage ping
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window || !event.data) return
            if (
                event.data.type === 'CRE8_EXTENSION_INSTALLED' ||
                event.data.type === 'CRE8_PONG'
            ) {
                setExtensionInstalled(true)
                extensionInstalledRef.current = true
            }
        }

        window.addEventListener('message', handleMessage)
        window.postMessage({ type: 'CRE8_PING' }, '*')

        const t1 = setTimeout(() => window.postMessage({ type: 'CRE8_PING' }, '*'), 400)
        const t2 = setTimeout(() => window.postMessage({ type: 'CRE8_PING' }, '*'), 1200)

        return () => {
            window.removeEventListener('message', handleMessage)
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [])

    const handleOneClickSync = () => {
        setExtensionSyncing(true)
        setActiveError(null)

        const requestId = Math.random().toString(36).substring(2, 9)

        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', handleResponse)
            setExtensionSyncing(false)
            setActiveError(`${t('platforms.cookieConnectError')}: Extension timeout`)
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
                    } catch (err: any) {
                        setExtensionSyncing(false)
                        setActiveError(
                            `${t('platforms.cookieConnectError')}: ${
                                err?.data?.message || err?.message || ''
                            }`
                        )
                    }
                } else {
                    setExtensionSyncing(false)
                    if (res?.error === 'NOT_LOGGED_IN') {
                        setActiveError(t('platforms.extensionErrorNotLoggedIn'))
                    } else {
                        setActiveError(
                            `${t('platforms.cookieConnectError')}: ${res?.message || ''}`
                        )
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

    const handleRefreshExtension = () => {
        setCheckingExtension(true)
        setActiveError(null)

        window.postMessage({ type: 'CRE8_PING' }, '*')

        setTimeout(() => {
            if (extensionInstalledRef.current) {
                setCheckingExtension(false)
                ToastComponent({
                    status: 'success',
                    message: t('platforms.extensionRefreshSuccess'),
                })
            } else {
                // In Chrome, newly installed unpacked extensions require a page reload
                // so the content script gets injected into existing tabs.
                window.location.reload()
            }
        }, 600)
    }

    const isConnected = scrape?.connected && !scrape.connecting

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {t('platforms.viewerTitle')}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                            {t('platforms.viewerDesc')}
                        </CardDescription>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Badge
                            variant={
                                scrape?.connecting
                                    ? 'secondary'
                                    : scrape?.connected
                                      ? 'default'
                                      : 'secondary'
                            }
                            className="text-xs font-medium"
                        >
                            {scrape?.connecting
                                ? t('platforms.waitingForLogin')
                                : scrape?.connected
                                  ? t('platforms.statusConnected')
                                  : scrape?.status === 'expired'
                                    ? t('platforms.statusExpired')
                                    : t('platforms.statusNotConnected')}
                        </Badge>
                        {scrape?.display_name ? (
                            <span className="text-xs font-semibold text-foreground/90">
                                {scrape.display_name}
                            </span>
                        ) : null}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Meta info & timestamps */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground border-b pb-4">
                    <div>
                        <p>
                            {t('platforms.chromeOpensHint')}
                            {scrape?.last_used_at
                                ? ` · ${t('platforms.lastUsed', {
                                      date: formatDateTime(scrape.last_used_at),
                                  })}`
                                : ''}
                            {scrape?.connected_at
                                ? ` · ${t('platforms.connectedAt', {
                                      date: formatDateTime(scrape.connected_at),
                                  })}`
                                : ''}
                        </p>
                        {scrape?.connect_error ? (
                            <p className="text-destructive mt-1 font-medium">
                                {scrape.connect_error}
                            </p>
                        ) : null}
                        {scrape?.status === 'expired' ? (
                            <p className="text-destructive mt-1 font-medium">
                                {t('platforms.sessionExpiredNotice')}
                            </p>
                        ) : null}
                    </div>

                    {/* Refresh / Disconnect Actions (when connected) */}
                    {isConnected && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void onRefresh()}
                                disabled={!canManage || refreshing}
                                className="h-8 text-xs gap-1.5"
                            >
                                <RefreshCw
                                    className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`}
                                />
                                {t('platforms.refreshSession')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void onDisconnect()}
                                disabled={!canManage || disconnecting}
                                className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                            >
                                <Unplug className="size-3.5" />
                                {t('platforms.disconnect')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Diagnostic Error Banner */}
                {activeError && (
                    <Alert
                        variant="destructive"
                        className="border-destructive/60 bg-destructive/10"
                    >
                        <AlertCircle className="size-4 text-destructive" />
                        <AlertTitle className="font-semibold text-destructive text-sm">
                            {t('common:error')}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1 leading-relaxed text-destructive/90 font-medium">
                            {activeError}
                        </AlertDescription>
                    </Alert>
                )}

                {/* In-Page 1-Click Extension Section */}
                <div className="space-y-4 pt-1">
                    {extensionInstalled ? (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Badge className="bg-emerald-600 text-white gap-1.5 text-xs">
                                    <CheckCircle2 className="size-3.5" />
                                    {t('platforms.extensionDetected')}
                                </Badge>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenFacebook}
                                    className="text-xs gap-1.5 h-7"
                                >
                                    <ExternalLink className="size-3.5" />
                                    {t('platforms.cookieOpenFacebook')}
                                </Button>
                            </div>

                            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                                {t('platforms.extensionOneClickDesc')}
                            </p>

                            <div className="pt-1">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="w-full sm:w-auto min-w-[280px] h-11 text-sm font-semibold shadow-md gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                    onClick={handleOneClickSync}
                                    disabled={
                                        extensionSyncing ||
                                        connecting ||
                                        !canManage
                                    }
                                >
                                    {extensionSyncing || connecting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            {t('platforms.extensionSyncing')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="size-4 text-amber-300" />
                                            {isConnected
                                                ? t('platforms.extensionOneClickBtn') +
                                                  ' (Sync Again)'
                                                : t('platforms.extensionOneClickBtn')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/80 bg-muted/30 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Badge
                                    variant="secondary"
                                    className="gap-1.5 text-xs font-medium"
                                >
                                    <Zap className="size-3.5 text-amber-500" />
                                    {t('platforms.extensionNotDetected')}
                                </Badge>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefreshExtension}
                                        disabled={checkingExtension}
                                        className="h-8 px-2.5 text-xs gap-1.5 shadow-sm"
                                        title={t('platforms.extensionRefreshBtn')}
                                    >
                                        <RefreshCw
                                            className={`size-3.5 ${
                                                checkingExtension ? 'animate-spin' : ''
                                            }`}
                                        />
                                        {t('platforms.extensionRefreshBtn')}
                                    </Button>
                                    <a
                                        href="/cre8-extension.zip"
                                        download="cre8-extension.zip"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        <Download className="size-3.5" />
                                        {t('platforms.extensionDownloadBtn')}
                                    </a>
                                </div>
                            </div>

                            <div className="text-xs space-y-2.5 text-muted-foreground pt-1">
                                <p className="font-semibold text-foreground text-sm">
                                    {t('platforms.extensionInstallTitle')}
                                </p>
                                <div className="space-y-2 pl-1">
                                    <p>{t('platforms.extensionInstallStep1')}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>{t('platforms.extensionInstallStep2')}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyChromeExtensions}
                                            className="h-6 px-2 text-xs font-mono gap-1 text-primary hover:text-primary shrink-0 transition-all"
                                            title={t('platforms.copyChromeExtensions')}
                                        >
                                            {copiedLink ? (
                                                <>
                                                    <Check className="size-3 text-emerald-500" />
                                                    <span className="text-emerald-600 font-semibold">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3" />
                                                    <span>Copy chrome://extensions</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>{t('platforms.extensionInstallStep3')}</span>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRefreshExtension}
                                            disabled={checkingExtension}
                                            className="h-6 px-2 text-xs gap-1 font-medium shrink-0"
                                        >
                                            <RefreshCw
                                                className={`size-3 ${
                                                    checkingExtension ? 'animate-spin' : ''
                                                }`}
                                            />
                                            {t('platforms.extensionRefreshBtn')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
