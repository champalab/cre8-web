import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {  ExternalLink, History, Link2, Loader2, Pencil, RefreshCw, Globe2Icon } from 'lucide-react'
import {
    Actor,
    InfluencerSocialAccount,
    PROFILE_METRIC_PLATFORMS,
    SOCIAL_PLATFORMS,
    useDisconnectOAuthConnectionMutation,
    useGetInfluencerSocialAccountsQuery,
    useGetOAuthConnectionStatusQuery,
    useGetProfileMetricsBatchStatusMutation,
    useRefreshAllInfluencerSocialAccountsMutation,
    useRefreshInfluencerSocialAccountMutation,
    useUpsertInfluencerSocialAccountMutation,
} from '@/stores/services/actorApi'
import BackdropComponent from '@/components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import { alertWarning } from '@/utils/alerts'
import { formatDateTime } from '@/utils/datetime'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProfileMetricsHistoryDialog } from './ProfileMetricsHistoryDialog'

const emptyForm = {
    platform: 'facebook',
    profile_url: '',
    handle: '',
    follower_count: '',
    following_count: '',
}

const formatCount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return `${value}`
    return num.toLocaleString()
}

const canFetchProfileMetrics = (platform: string) =>
    PROFILE_METRIC_PLATFORMS.includes(platform.toLowerCase() as (typeof PROFILE_METRIC_PLATFORMS)[number])

type Props = {
    actor: Actor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdated?: () => void
}

export function SocialAccountsDialog({ actor, open, onOpenChange, onUpdated }: Props) {
    const { t } = useTranslation('app')
    const [form, setForm] = useState(emptyForm)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [batchProgress, setBatchProgress] = useState<{
        total: number
        finished: number
        failed: number
    } | null>(null)
    const [historyAccount, setHistoryAccount] = useState<InfluencerSocialAccount | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [refreshingAccountUuid, setRefreshingAccountUuid] = useState<string | null>(null)
    const formCardRef = useRef<HTMLDivElement | null>(null)

    const { data, isLoading, isFetching, refetch } = useGetInfluencerSocialAccountsQuery(actor?.uuid ?? '', {
        skip: !open || !actor?.uuid,
    })
    const [upsertSocialAccount, { isLoading: saving }] = useUpsertInfluencerSocialAccountMutation()
    const [refreshSocialAccount] = useRefreshInfluencerSocialAccountMutation()
    const [refreshAllSocialAccounts, { isLoading: queueingAll }] =
        useRefreshAllInfluencerSocialAccountsMutation()
    const [getBatchStatus] = useGetProfileMetricsBatchStatusMutation()
    const [, { isLoading: disconnectingOAuth }] = useDisconnectOAuthConnectionMutation()

    const { data: facebookOAuth } = useGetOAuthConnectionStatusQuery(
        { platform: 'facebook', actorId: actor?.id ?? 0 },
        { skip: !open || !actor?.id }
    )
    const { data: tiktokOAuth } = useGetOAuthConnectionStatusQuery(
        { platform: 'tiktok', actorId: actor?.id ?? 0 },
        { skip: !open || !actor?.id }
    )

    const accounts: InfluencerSocialAccount[] = data?.data ?? actor?.influencer_social_accounts ?? []
    const facebookConnected = Boolean(facebookOAuth?.data?.connected)
    const tiktokConnected = Boolean(tiktokOAuth?.data?.connected)

    const linkedPlatforms = useMemo(() => new Set(accounts.map((item) => item.platform)), [accounts])

    const availablePlatforms = SOCIAL_PLATFORMS.filter(
        (platform) => !linkedPlatforms.has(platform) || platform === form.platform
    )

    const fetchableCount = accounts.filter(
        (account) => canFetchProfileMetrics(account.platform) && Boolean(account.profile_url)
    ).length

    useEffect(() => {
        if (!open || !actor) {
            setForm(emptyForm)
            return
        }

        const nextPlatform = SOCIAL_PLATFORMS.find(
            (platform) => !accounts.some((item) => item.platform === platform)
        )
        if (nextPlatform) {
            setForm({ ...emptyForm, platform: nextPlatform })
            return
        }

        const first = accounts[0]
        if (first) {
            setForm({
                platform: first.platform,
                profile_url: first.profile_url,
                handle: first.handle ?? '',
                follower_count:
                    first.follower_count != null && first.follower_count !== ''
                        ? String(first.follower_count)
                        : '',
                following_count:
                    first.following_count != null && first.following_count !== ''
                        ? String(first.following_count)
                        : '',
            })
        } else {
            setForm(emptyForm)
        }
    }, [open, actor?.uuid, accounts])

    useEffect(() => {
        if (!batchId || !actor?.uuid) return

        let cancelled = false
        let checking = false
        const checkStatus = async () => {
            if (checking) return
            checking = true
            try {
                const response = await getBatchStatus({ uuid: actor.uuid, batchId }).unwrap()
                if (cancelled) return
                const status = response.data
                setBatchProgress({
                    total: status.total,
                    finished: status.finished,
                    failed: status.failed,
                })
                if (status.done) {
                    setBatchId(null)
                    await refetch()
                    onUpdated?.()
                    ToastComponent({
                        status: status.failed > 0 ? 'warning' : 'success',
                        message:
                            status.failed > 0
                                ? `Profile metrics done ${status.completed}/${status.total}; failed ${status.failed}`
                                : `Profile metrics refreshed for ${status.completed} platforms`,
                    })
                }
            } catch {
                // Keep polling through temporary status failures.
            } finally {
                checking = false
            }
        }

        void checkStatus()
        const interval = window.setInterval(checkStatus, 2500)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [batchId, actor?.uuid, getBatchStatus, refetch, onUpdated])

    const handlePlatformChange = (platform: string) => {
        const existing = accounts.find((item) => item.platform === platform)
        if (existing) {
            setForm({
                platform,
                profile_url: existing.profile_url,
                handle: existing.handle ?? '',
                follower_count:
                    existing.follower_count != null && existing.follower_count !== ''
                        ? String(existing.follower_count)
                        : '',
                following_count:
                    existing.following_count != null && existing.following_count !== ''
                        ? String(existing.following_count)
                        : '',
            })
            return
        }
        setForm({ ...emptyForm, platform })
    }

    const handleEditProfileUrl = (account: InfluencerSocialAccount) => {
        handlePlatformChange(account.platform)
        window.setTimeout(() => {
            formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            document.getElementById('social_profile_url')?.focus()
        }, 0)
    }

    const handleSubmit = async () => {
        if (!actor?.uuid) return
        if (!form.profile_url.trim()) return alertWarning({ text: 'Please enter Profile URL' })

        const response = await upsertSocialAccount({
            uuid: actor.uuid,
            body: {
                platform: form.platform,
                profile_url: form.profile_url.trim(),
                handle: form.handle.trim() || undefined,
                follower_count: form.follower_count.trim() ? Number(form.follower_count) : undefined,
                following_count: form.following_count.trim()
                    ? Number(form.following_count)
                    : undefined,
            },
        })

        const payload = getMutationPayload(response)
        if (payload) ToastComponent(payload)
        if (!isMutationSuccess(payload)) return

        await refetch()
        onUpdated?.()
    }

    const handleRefresh = async (account: InfluencerSocialAccount) => {
        if (!actor?.uuid) return
        if (!canFetchProfileMetrics(account.platform)) {
            return alertWarning({ text: 'Supported: TikTok, Facebook, Instagram' })
        }
        setRefreshingAccountUuid(account.uuid)
        try {
            const response = await refreshSocialAccount({
                uuid: actor.uuid,
                accountUuid: account.uuid,
            })
            const payload = getMutationPayload(response)
            if (payload) ToastComponent(payload)
            if (isMutationSuccess(payload)) {
                await refetch()
                onUpdated?.()
            }
        } finally {
            setRefreshingAccountUuid(null)
        }
    }

    const handleRefreshAll = async () => {
        if (!actor?.uuid) return
        if (fetchableCount === 0) {
            return alertWarning({
                text: 'No TikTok / Facebook / Instagram profile URLs to fetch',
            })
        }
        try {
            const response = await refreshAllSocialAccounts(actor.uuid).unwrap()
            if (response.data.queued === 0) {
                ToastComponent({
                    status: 'warning',
                    message: 'No eligible profiles queued',
                })
                return
            }
            setBatchProgress({
                total: response.data.queued,
                finished: 0,
                failed: 0,
            })
            setBatchId(response.data.batch_id)
            ToastComponent({
                status: 'success',
                message: `Queued ${response.data.queued} profile metrics in background`,
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || 'Failed to queue profile metrics',
            })
        }
    }

    const isEditing = linkedPlatforms.has(form.platform)
    const busy =
        isLoading || isFetching || saving || queueingAll || Boolean(batchId) || disconnectingOAuth

    const renderAccountActions = (account: InfluencerSocialAccount) => (
        <TooltipProvider>
            <div className="inline-flex items-center gap-0.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEditProfileUrl(account)
                            }}
                        >
                            <Pencil className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('influencers.updateProfileUrlTooltip')}</TooltipContent>
                </Tooltip>
                {account.profile_url ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(account.profile_url, '_blank', 'noopener,noreferrer')
                                }}
                            >
                                <ExternalLink className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('influencers.openProfile')}</TooltipContent>
                    </Tooltip>
                ) : null}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                setHistoryAccount(account)
                                setHistoryOpen(true)
                            }}
                        >
                            <History className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('influencers.historyTooltip')}</TooltipContent>
                </Tooltip>
                {canFetchProfileMetrics(account.platform) ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                disabled={refreshingAccountUuid != null || Boolean(batchId)}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    void handleRefresh(account)
                                }}
                            >
                                {refreshingAccountUuid === account.uuid ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="size-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('influencers.refreshTooltip')}</TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </TooltipProvider>
    )

    return (
        <>
            <BackdropComponent open={busy && !batchId} />

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="size-5" />
                            Social Accounts
                        </DialogTitle>
                        <DialogDescription>
                            {t('influencers.socialAccountsDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    {actor && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-12">
                                        <AvatarImage src={actor.profile_url || undefined} />
                                        <AvatarFallback>{actor.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-semibold">{actor.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {actor.email || actor.uuid}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {actor.phone_number || t('influencers.noPhone')}
                                        </p>
                                        {batchProgress && batchId ? (
                                             <p className="mt-1 text-xs font-medium text-primary">
                                                 {t('influencers.fetchingProfiles', {
                                                     finished: batchProgress.finished,
                                                     total: batchProgress.total,
                                                     failed: batchProgress.failed > 0 ? ` · ${t('campaigns.failedCount', { count: batchProgress.failed })}` : ''
                                                 })}
                                             </p>
                                         ) : null}
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                                        {/* {facebookConnected ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                onClick={() => void handleDisconnectOAuth('facebook')}
                                                disabled={disconnectingOAuth}
                                            >
                                                <Unplug className="size-3.5" />
                                                {t('influencers.disconnectFB')}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                onClick={handleConnectFacebook}
                                            >
                                                <span className="text-xs font-bold">FB</span>
                                                OAuth
                                            </Button>
                                        )}
                                        {tiktokConnected ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                onClick={() => void handleDisconnectOAuth('tiktok')}
                                                disabled={disconnectingOAuth}
                                            >
                                                <Unplug className="size-3.5" />
                                                {t('influencers.disconnectTT')}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                onClick={handleConnectTikTok}
                                            >
                                                <span className="text-xs font-bold">TT</span>
                                                OAuth
                                            </Button>
                                        )} */}
                                        <Button
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={handleRefreshAll}
                                            disabled={queueingAll || Boolean(batchId) || fetchableCount === 0}
                                        >
                                            {queueingAll || batchId ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Globe2Icon className="size-4" />
                                            )}
                                            {batchId ? t('influencers.gettingMetrics') : t('influencers.getAllMetrics')}
                                        </Button>
                                    </div>
                                    <div className="flex w-full flex-wrap gap-1.5 text-[11px] text-muted-foreground sm:justify-end">
                                        <Badge variant={facebookConnected ? 'default' : 'secondary'}>
                                            {facebookConnected ? t('influencers.fbConnected') : t('influencers.fbNotConnected')}
                                            {facebookOAuth?.data?.expiring_soon ? t('influencers.fbExpiring') : ''}
                                        </Badge>
                                        <Badge variant={tiktokConnected ? 'default' : 'secondary'}>
                                            {tiktokConnected ? t('influencers.ttConnected') : t('influencers.ttNotConnected')}
                                        </Badge>
                                        <span className="w-full text-right sm:w-auto">
                                            {t('influencers.oauthMetricsHint')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{t('influencers.linkedAccounts')}</CardTitle>
                                    <CardDescription>
                                        {accounts.length > 0
                                            ? t('influencers.linkedAccountsDesc', { count: accounts.length, fetchable: fetchableCount })
                                            : t('influencers.noSocialAccountsYet')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pb-4">
                                    {accounts.length > 0 ? (
                                        <>
                                            <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-3">
                                                {accounts.map((account) => (
                                                    <div
                                                        key={account.uuid}
                                                        className="group overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                                                        onClick={() => handlePlatformChange(account.platform)}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold uppercase text-primary">
                                                                    {account.platform.slice(0, 2)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold capitalize">
                                                                        {account.platform}
                                                                    </p>
                                                                    <p className="truncate text-xs text-muted-foreground">
                                                                        {account.handle || t('influencers.noHandle')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    account.status === 'ACTIVE'
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {account.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                                            <div className="rounded-lg border bg-background/80 p-3">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('influencers.followers')}
                                                                </p>
                                                                <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
                                                                    {formatCount(account.follower_count)}
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg border bg-background/80 p-3">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('influencers.following')}
                                                                </p>
                                                                <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
                                                                    {formatCount(account.following_count)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-3 truncate text-xs text-muted-foreground" title={account.profile_url}>
                                                            {account.profile_url}
                                                        </p>
                                                         <p className="mt-1 text-[11px] text-muted-foreground">
                                                             {t('influencers.lastSync', { date: formatDateTime(account.last_scraped_at) })}
                                                         </p>
                                                        {account.last_error_code ? (
                                                            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
                                                                <p className="text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-400">
                                                                    {account.last_error_code}
                                                                </p>
                                                                {account.last_error_message ? (
                                                                    <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                                                                        {account.last_error_message}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                        <div
                                                            className="mt-3 flex justify-end border-t pt-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {renderAccountActions(account)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="hidden">
                                                <Table className="min-w-[760px]">
                                                    <TableHeader>
                                                        <TableRow>
                                                            {[
                                                                'Platform',
                                                                'Handle',
                                                                'Followers',
                                                                'Following',
                                                                'Source',
                                                                'Last Scraped',
                                                                'Status',
                                                                '',
                                                            ].map((header) => (
                                                                <TableHead
                                                                    key={header || 'actions'}
                                                                    className={
                                                                        header === '' ? 'text-right' : undefined
                                                                    }
                                                                >
                                                                    {header}
                                                                </TableHead>
                                                            ))}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {accounts.map((account) => (
                                                            <TableRow
                                                                key={account.uuid}
                                                                className={
                                                                    form.platform === account.platform
                                                                        ? 'bg-muted/40'
                                                                        : undefined
                                                                }
                                                                onClick={() =>
                                                                    handlePlatformChange(account.platform)
                                                                }
                                                            >
                                                                <TableCell className="font-medium capitalize">
                                                                    {account.platform}
                                                                </TableCell>
                                                                <TableCell>{account.handle || '—'}</TableCell>
                                                                <TableCell className="tabular-nums">
                                                                    {formatCount(account.follower_count)}
                                                                </TableCell>
                                                                <TableCell className="tabular-nums">
                                                                    {formatCount(account.following_count)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="font-normal"
                                                                    >
                                                                        {account.follower_source}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {formatDateTime(account.last_scraped_at)}
                                                                    {account.last_error_code ? (
                                                                        <div className="max-w-[160px]">
                                                                            <div className="truncate text-destructive">
                                                                                {account.last_error_code}
                                                                            </div>
                                                                            {account.last_error_message ? (
                                                                                <div
                                                                                    className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground"
                                                                                    title={account.last_error_message}
                                                                                >
                                                                                    {account.last_error_message}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    ) : null}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            account.status === 'ACTIVE'
                                                                                ? 'default'
                                                                                : 'secondary'
                                                                        }
                                                                    >
                                                                        {account.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="whitespace-nowrap text-right">
                                                                    {renderAccountActions(account)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="px-6 pb-2 text-sm text-muted-foreground">
                                            {t('influencers.addProfileUrlPrompt')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card ref={formCardRef}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        {isEditing ? t('influencers.editSocialAccount') : t('influencers.addSocialAccount')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('influencers.socialAccountDesc')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>{t('influencers.platformLabel')}</Label>
                                            <Select value={form.platform} onValueChange={handlePlatformChange}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePlatforms.map((platform) => (
                                                        <SelectItem key={platform} value={platform}>
                                                            {platform}
                                                            {linkedPlatforms.has(platform) ? t('influencers.linkedLabel') : ''}
                                                            {canFetchProfileMetrics(platform)
                                                                ? ''
                                                                : t('influencers.noAutoMetrics')}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="social_handle">{t('influencers.handleLabel')}</Label>
                                            <Input
                                                id="social_handle"
                                                value={form.handle}
                                                onChange={(e) =>
                                                    setForm({ ...form, handle: e.target.value })
                                                }
                                                placeholder="username"
                                            />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="social_profile_url">{t('influencers.profileUrlStar')}</Label>
                                            <Input
                                                id="social_profile_url"
                                                value={form.profile_url}
                                                onChange={(e) => {
                                                    const profileUrl = e.target.value
                                                    const existing = accounts.find(
                                                        (item) => item.platform === form.platform
                                                    )
                                                    const changed =
                                                        existing != null &&
                                                        existing.profile_url !== profileUrl
                                                    setForm({
                                                        ...form,
                                                        profile_url: profileUrl,
                                                        ...(changed
                                                            ? {
                                                                follower_count: '',
                                                                following_count: '',
                                                            }
                                                            : {}),
                                                    })
                                                }}
                                                placeholder={
                                                    form.platform === 'tiktok'
                                                        ? 'https://www.tiktok.com/@username'
                                                        : form.platform === 'instagram'
                                                            ? 'https://www.instagram.com/username'
                                                            : form.platform === 'facebook'
                                                                ? 'https://www.facebook.com/username'
                                                                : 'https://...'
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="follower_count">{t('influencers.followersManual')}</Label>
                                            <Input
                                                id="follower_count"
                                                type="number"
                                                min={0}
                                                value={form.follower_count}
                                                onChange={(e) =>
                                                    setForm({ ...form, follower_count: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="following_count">{t('influencers.followingManual')}</Label>
                                            <Input
                                                id="following_count"
                                                type="number"
                                                min={0}
                                                value={form.following_count}
                                                onChange={(e) =>
                                                    setForm({ ...form, following_count: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end">
                                            <Button
                                                className="w-full sm:w-auto"
                                                onClick={handleSubmit}
                                                disabled={saving || Boolean(batchId)}
                                            >
                                                {isEditing ? t('influencers.updateBtn') : t('influencers.addSocialAccount')}
                                            </Button>
                                            {isEditing ? (
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:w-auto"
                                                    onClick={() => {
                                                        const next = SOCIAL_PLATFORMS.find(
                                                            (p) => !linkedPlatforms.has(p)
                                                        )
                                                        setForm(
                                                            next ? { ...emptyForm, platform: next } : emptyForm
                                                        )
                                                    }}
                                                >
                                                    {t('influencers.addNew')}
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ProfileMetricsHistoryDialog
                actor={actor}
                account={historyAccount}
                open={historyOpen}
                onOpenChange={(next) => {
                    setHistoryOpen(next)
                    if (!next) setHistoryAccount(null)
                }}
            />
        </>
    )
}
