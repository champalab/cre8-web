import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Banknote,
    BarChart3,
    ExternalLink,
    Globe2Icon,
    History,
    Link2,
    Loader2,
    Mail,
    Pencil,
    Phone,
    RefreshCw,
    User,
    UserPlus,
    Users
} from 'lucide-react'

import {
    Actor,
    InfluencerSocialAccount,
    PROFILE_METRIC_PLATFORMS,
    SOCIAL_PLATFORMS,
    useGetActorByIdQuery,
    useGetInfluencerSocialAccountsQuery,
    useGetProfileMetricsBatchStatusMutation,
    useRefreshAllInfluencerSocialAccountsMutation,
    useRefreshInfluencerSocialAccountMutation,
    useUpsertInfluencerSocialAccountMutation
} from '@/stores/services/actorApi'
import BackdropComponent from '@/components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import SafeImage from '@/components/ui/SafeImage'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { alertWarning, confirmDelete } from '@/utils/alerts'
import { formatDate, formatDateTime } from '@/utils/datetime'
import { getMutationPayload, isMutationSuccess } from '@/utils/mutation-response'
import { ProfileMetricsHistoryDialog } from './ProfileMetricsHistoryDialog'

export const formatCount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return `${value}`
    return num.toLocaleString()
}

export const getCountFontSize = (value: string | number | null | undefined) => {
    if (value == null || value === '') return 'text-base sm:text-lg'
    const len = String(formatCount(value)).length
    if (len >= 12) return 'text-[11px] sm:text-xs'
    if (len >= 9) return 'text-xs sm:text-sm'
    if (len >= 7) return 'text-sm sm:text-base'
    return 'text-base sm:text-lg'
}

export interface SocialAccountCardProps {
    account: InfluencerSocialAccount
    onClick?: () => void
    actions?: React.ReactNode
    showStatusBadge?: boolean
    className?: string
}

export function SocialAccountCard({
    account,
    onClick,
    actions,
    showStatusBadge = true,
    className = ''
}: SocialAccountCardProps) {
    const { t } = useTranslation('app')

    return (
        <div
            className={`group overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${onClick ? 'cursor-pointer' : ''
                } ${className}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold uppercase text-primary">
                        {account.platform.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold capitalize">{account.platform}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {account.handle || t('influencers.noHandle')}
                        </p>
                    </div>
                </div>
                {showStatusBadge && (
                    <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {account.status}
                    </Badge>
                )}
            </div>

            <div
                className={`mt-4 grid ${account.like_count != null || account.platform.toLowerCase() === 'tiktok'
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
                    } gap-2`}
            >
                <div
                    className="min-w-0 overflow-hidden rounded-lg border bg-background/80 p-2 sm:p-2.5"
                    title={formatCount(account.follower_count)}
                >
                    <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                        {t('influencers.followers')}
                    </p>
                    <p
                        className={`mt-0.5 truncate font-bold tracking-tight tabular-nums ${getCountFontSize(
                            account.follower_count
                        )}`}
                    >
                        {formatCount(account.follower_count)}
                    </p>
                </div>

                <div
                    className="min-w-0 overflow-hidden rounded-lg border bg-background/80 p-2 sm:p-2.5"
                    title={formatCount(account.following_count)}
                >
                    <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                        {t('influencers.following')}
                    </p>
                    <p
                        className={`mt-0.5 truncate font-bold tracking-tight tabular-nums ${getCountFontSize(
                            account.following_count
                        )}`}
                    >
                        {formatCount(account.following_count)}
                    </p>
                </div>

                {(account.like_count != null || account.platform.toLowerCase() === 'tiktok') && (
                    <div
                        className="min-w-0 overflow-hidden rounded-lg border bg-background/80 p-2 sm:p-2.5"
                        title={formatCount(account.like_count)}
                    >
                        <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                            {t('influencers.likes')}
                        </p>
                        <p
                            className={`mt-0.5 truncate font-bold tracking-tight tabular-nums text-rose-500 ${getCountFontSize(
                                account.like_count
                            )}`}
                        >
                            {formatCount(account.like_count)}
                        </p>
                    </div>
                )}
            </div>

            {account.profile_url ? (
                <a
                    href={account.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="group/link mt-3 inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    title={`Open ${account.platform} profile in new tab`}
                >
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
                    <span className="truncate underline-offset-4 group-hover/link:underline">
                        {account.profile_url}
                    </span>
                </a>
            ) : (
                <p className="mt-3 truncate text-xs text-muted-foreground">—</p>
            )}

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

            {actions ? (
                <div className="mt-3 flex justify-end border-t pt-2" onClick={(e) => e.stopPropagation()}>
                    {actions}
                </div>
            ) : null}
        </div>
    )
}


type SocialAccountForm = {
    platform: string
    profile_url: string
    handle: string
    follower_count: string
    following_count: string
}

const emptySocialForm: SocialAccountForm = {
    platform: 'tiktok',
    profile_url: '',
    handle: '',
    follower_count: '',
    following_count: ''
}

const formatFollowers = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return `${value}`
    return num.toLocaleString()
}

const getActorStatus = (status?: string | null) => (status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

const actorStatusClass = (status?: string | null) =>
    getActorStatus(status) === 'ACTIVE'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'border-slate-400/30 bg-slate-500/10 text-slate-600 dark:text-slate-400'

const canFetchProfileMetrics = (platform: string) =>
    PROFILE_METRIC_PLATFORMS.includes(
        platform.toLowerCase() as (typeof PROFILE_METRIC_PLATFORMS)[number]
    )

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="text-sm text-foreground">{value}</div>
        </div>
    )
}

function GalleryImageItem({ url, index }: { url: string; index: number }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 transition-all hover:border-primary/40 hover:opacity-90 sm:h-32 sm:w-32"
        >
            <SafeImage
                src={url}
                alt={`Profile ${index + 1}`}
                variant="gallery"
                fallbackText="Failed to load"
                className="transition-transform duration-300 group-hover:scale-105"
            />
        </a>
    )
}

type Props = {
    actor: Actor | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (actor: Actor) => void
    onSocialAccounts?: (actor: Actor) => void
    onUpdated?: () => void
    initialTab?: 'overview' | 'social'
}

export function ActorDetailDialog({
    actor,
    open,
    onOpenChange,
    onEdit,
    onSocialAccounts,
    onUpdated,
    initialTab = 'social'
}: Props) {
    const { t } = useTranslation('app')
    const [activeTab, setActiveTab] = useState<'overview' | 'social'>(initialTab)

    // Form & UI states for social accounts
    const [form, setForm] = useState<SocialAccountForm>(emptySocialForm)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [batchProgress, setBatchProgress] = useState<{
        total: number
        finished: number
        failed: number
    } | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyAccount, setHistoryAccount] = useState<InfluencerSocialAccount | null>(null)
    const [refreshingAccountUuid, setRefreshingAccountUuid] = useState<string | null>(null)
    const formCardRef = useRef<HTMLDivElement | null>(null)

    // Sync tab when dialog opens
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab)
        }
    }, [open, initialTab])

    // Query actor details
    const {
        data: actorDetailData,
        isLoading: isActorLoading,
        isFetching: isActorFetching
    } = useGetActorByIdQuery(actor?.id ?? 0, {
        skip: !open || !actor?.id
    })

    // Social accounts query & mutations
    const {
        data: socialData,
        isLoading: isSocialLoading,
        isFetching: isSocialFetching,
        refetch: refetchSocial
    } = useGetInfluencerSocialAccountsQuery(actor?.uuid ?? '', {
        skip: !open || !actor?.uuid,
        refetchOnMountOrArgChange: true
    })

    const [upsertSocialAccount, { isLoading: savingSocial }] = useUpsertInfluencerSocialAccountMutation()
    const [refreshSocialAccount] = useRefreshInfluencerSocialAccountMutation()
    const [refreshAllSocialAccounts, { isLoading: queueingAll }] = useRefreshAllInfluencerSocialAccountsMutation()
    const [getBatchStatus] = useGetProfileMetricsBatchStatusMutation()

    const detail: Actor | null = actorDetailData?.data ?? actor
    const accounts: InfluencerSocialAccount[] =
        socialData?.data ?? detail?.influencer_social_accounts ?? []

    const hasFollowerData = accounts.some((account) => account.follower_count != null)
    const hasFollowingData = accounts.some((account) => account.following_count != null)
    const totalFollowers = accounts.reduce(
        (sum, account) => sum + Number(account.follower_count || 0),
        0
    )
    const totalFollowing = accounts.reduce(
        (sum, account) => sum + Number(account.following_count || 0),
        0
    )

    const linkedPlatforms = useMemo(() => new Set(accounts.map((item) => item.platform)), [accounts])
    const availablePlatforms = SOCIAL_PLATFORMS.filter(
        (platform) => !linkedPlatforms.has(platform) || platform === form.platform
    )
    const fetchableCount = accounts.filter(
        (account) => canFetchProfileMetrics(account.platform) && Boolean(account.profile_url)
    ).length

    // Populate form on account selection or open
    useEffect(() => {
        if (!open || !actor) {
            setForm(emptySocialForm)
            return
        }

        const nextPlatform = SOCIAL_PLATFORMS.find(
            (platform) => !accounts.some((item) => item.platform === platform)
        )
        if (nextPlatform) {
            setForm({ ...emptySocialForm, platform: nextPlatform })
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
                        : ''
            })
        } else {
            setForm(emptySocialForm)
        }
    }, [open, actor?.uuid, accounts])

    // Background batch status polling
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
                    failed: status.failed
                })
                if (status.done) {
                    setBatchId(null)
                    await refetchSocial()
                    onUpdated?.()
                    ToastComponent({
                        status: status.failed > 0 ? 'warning' : 'success',
                        message:
                            status.failed > 0
                                ? `Profile metrics done ${status.completed}/${status.total}; failed ${status.failed}`
                                : `Profile metrics refreshed for ${status.completed} platforms`
                    })
                }
            } catch {
                // Ignore transient network errors
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
    }, [batchId, actor?.uuid, getBatchStatus, refetchSocial, onUpdated])

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
                        : ''
            })
            return
        }
        setForm({ ...emptySocialForm, platform })
    }

    const handleEditProfileUrl = (account: InfluencerSocialAccount) => {
        handlePlatformChange(account.platform)
        window.setTimeout(() => {
            formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            document.getElementById('social_profile_url')?.focus()
        }, 0)
    }

    const handleSubmitSocial = async () => {
        if (!actor?.uuid) return
        if (!form.profile_url.trim()) return alertWarning({ text: 'Please enter Profile URL' })

        const response = await upsertSocialAccount({
            uuid: actor.uuid,
            body: {
                platform: form.platform,
                profile_url: form.profile_url.trim(),
                handle: form.handle.trim() || undefined,
                follower_count: form.follower_count.trim() ? Number(form.follower_count) : undefined,
                following_count: form.following_count.trim() ? Number(form.following_count) : undefined
            }
        })

        const payload = getMutationPayload(response)
        if (payload) ToastComponent(payload)
        if (!isMutationSuccess(payload)) return

        await refetchSocial()
        onUpdated?.()
    }

    const handleRefreshSingle = async (account: InfluencerSocialAccount) => {
        if (!actor?.uuid) return
        if (!canFetchProfileMetrics(account.platform)) {
            return alertWarning({ text: 'Supported: TikTok, Facebook, Instagram' })
        }
        setRefreshingAccountUuid(account.uuid)
        try {
            const response = await refreshSocialAccount({
                uuid: actor.uuid,
                accountUuid: account.uuid
            })
            const payload = getMutationPayload(response)
            if (payload) ToastComponent(payload)
            if (isMutationSuccess(payload)) {
                await refetchSocial()
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
                text: 'No TikTok / Facebook / Instagram profile URLs to fetch'
            })
        }
        try {
            const response = await refreshAllSocialAccounts(actor.uuid).unwrap()
            if (response.data.queued === 0) {
                ToastComponent({
                    status: 'warning',
                    message: 'No eligible profiles queued'
                })
                return
            }
            setBatchProgress({
                total: response.data.queued,
                finished: 0,
                failed: 0
            })
            setBatchId(response.data.batch_id)
            ToastComponent({
                status: 'success',
                message: `Queued ${response.data.queued} profile metrics in background`
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || 'Failed to queue profile metrics'
            })
        }
    }

    const isEditingSocial = linkedPlatforms.has(form.platform)
    const isBusy =
        isActorLoading ||
        isActorFetching ||
        isSocialLoading ||
        isSocialFetching ||
        savingSocial ||
        queueingAll

    const renderAccountActions = (acc: InfluencerSocialAccount) => (
        <TooltipProvider>
            <div className="inline-flex items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEditProfileUrl(acc)
                            }}
                        >
                            <Pencil className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('influencers.updateProfileUrlTooltip')}</TooltipContent>
                </Tooltip>

                {acc.profile_url ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(acc.profile_url, '_blank', 'noopener,noreferrer')
                                }}
                            >
                                <ExternalLink className="size-3.5" />
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
                                setHistoryAccount(acc)
                                setHistoryOpen(true)
                            }}
                        >
                            <History className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('influencers.historyTooltip')}</TooltipContent>
                </Tooltip>

                {canFetchProfileMetrics(acc.platform) ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-primary hover:text-primary"
                                disabled={refreshingAccountUuid === acc.uuid || Boolean(batchId)}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    void handleRefreshSingle(acc)
                                }}
                            >
                                <RefreshCw
                                    className={`size-3.5 ${refreshingAccountUuid === acc.uuid ? 'animate-spin' : ''
                                        }`}
                                />
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
            <BackdropComponent open={isBusy && !batchId} />

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto p-0 sm:w-full">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{detail?.name || t('influencers.profileTitle')}</DialogTitle>
                        <DialogDescription>{t('influencers.profileInformation')}</DialogDescription>
                    </DialogHeader>

                    {detail && (
                        <div className="space-y-4 pb-5">
                            {/* Profile Header Banner */}
                            <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/20 via-primary/5 to-background px-5 pb-6 pt-7 sm:px-7">
                                <div className="absolute -right-16 -top-20 size-52 rounded-full bg-primary/10 blur-3xl" />
                                <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                                    <Avatar className="size-20 border-4 border-background shadow-lg sm:size-24">
                                        <AvatarImage src={detail.profile_url || undefined} />
                                        <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground sm:text-3xl">
                                            {detail.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                            {t('influencers.profileTitle')}
                                        </p>
                                        <h2 className="text-2xl font-bold tracking-tight">{detail.name}</h2>
                                        <p className="mt-0.5 break-all text-xs text-muted-foreground">
                                            Actor #{detail.id} · {detail.uuid}
                                        </p>
                                        <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                                            <Badge
                                                variant="outline"
                                                className={`font-bold uppercase ${actorStatusClass(detail.status)}`}
                                            >
                                                {getActorStatus(detail.status)}
                                            </Badge>
                                            <Badge variant={detail.users ? 'default' : 'outline'}>
                                                {detail.users
                                                    ? t('influencers.loginStatus', { status: detail.users.status })
                                                    : t('influencers.noUserAccount')}
                                            </Badge>
                                            <Badge variant="outline">
                                                {t('influencers.linkedPlatforms', { count: accounts.length })}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Metric Stats Cards */}
                            <div className="-mt-1 grid grid-cols-3 gap-2 px-4 sm:gap-3 sm:px-6">
                                <Card className="border-primary/15 bg-gradient-to-br from-primary/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <BarChart3 className="mb-2 size-4 text-primary sm:size-5" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                                            {t('influencers.platforms')}
                                        </p>
                                        <p className="text-xl font-bold tabular-nums sm:text-2xl">
                                            {accounts.length}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <Users className="mb-2 size-4 text-sky-600 sm:size-5" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                                            {t('influencers.followers')}
                                        </p>
                                        <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                                            {hasFollowerData ? formatFollowers(totalFollowers) : '—'}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/10 to-background">
                                    <CardContent className="p-3 sm:p-4">
                                        <UserPlus className="mb-2 size-4 text-violet-600 sm:size-5" />
                                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                                            {t('influencers.following')}
                                        </p>
                                        <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                                            {hasFollowingData ? formatFollowers(totalFollowing) : '—'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Unified Navigation Tabs */}
                            <Tabs
                                value={activeTab}
                                onValueChange={(val) => setActiveTab(val as 'overview' | 'social')}
                                className="w-full"
                            >
                                <div className="border-b px-4 sm:px-6">
                                    <TabsList className="h-11 w-full justify-start gap-4 rounded-none border-b-0 bg-transparent p-0">
                                        <TabsTrigger
                                            value="social"
                                            className="relative h-11 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                                        >
                                            <Link2 className="mr-2 size-4" />
                                            {t('influencers.socialAccounts')}
                                            {accounts.length > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2 px-1.5 py-0 text-[10px] font-bold"
                                                >
                                                    {accounts.length}
                                                </Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="overview"
                                            className="relative h-11 rounded-none border-b-2 border-b-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                                        >
                                            <User className="mr-2 size-4" />
                                            {t('influencers.profileTitle')}
                                        </TabsTrigger>

                                    </TabsList>
                                </div>

                                {/* TAB 1: OVERVIEW */}
                                <TabsContent value="overview" className="m-0 space-y-4 pt-4">
                                    <Card className="mx-4 sm:mx-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">
                                                {t('influencers.profileInformation')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 sm:grid-cols-2">
                                            <DetailField
                                                label={t('common:email')}
                                                value={
                                                    detail.email ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <Mail className="size-4 text-muted-foreground" />
                                                            {detail.email}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )
                                                }
                                            />
                                            <DetailField
                                                label={t('common:phone')}
                                                value={
                                                    detail.phone_number ? (
                                                        <a
                                                            href={`tel:${detail.phone_number}`}
                                                            className="inline-flex items-center gap-2 text-primary hover:underline"
                                                        >
                                                            <Phone className="size-4" />
                                                            {detail.phone_number}
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )
                                                }
                                            />
                                            <DetailField
                                                label={t('influencers.profileUrlLabel')}
                                                value={
                                                    detail.profile_url ? (
                                                        <a
                                                            href={detail.profile_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                            {t('influencers.openProfile')}
                                                        </a>
                                                    ) : (
                                                        '—'
                                                    )
                                                }
                                            />
                                            <DetailField
                                                label={t('influencers.statusLabel')}
                                                value={
                                                    <Badge
                                                        variant="outline"
                                                        className={`font-bold uppercase ${actorStatusClass(
                                                            detail.status
                                                        )}`}
                                                    >
                                                        {getActorStatus(detail.status)}
                                                    </Badge>
                                                }
                                            />
                                            <DetailField label={t('influencers.actorId')} value={detail.id} />
                                            <DetailField
                                                label={t('influencers.createdAt')}
                                                value={formatDate(detail.created_at)}
                                            />
                                            <DetailField
                                                label={t('influencers.updatedAt')}
                                                value={formatDate(detail.updated_at)}
                                            />
                                        </CardContent>
                                    </Card>

                                    {detail.profile_urls && detail.profile_urls.length > 0 && (
                                        <Card className="mx-4 sm:mx-6">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">
                                                    {t('influencers.photoGallery')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-3">
                                                    {detail.profile_urls.map((url, i) => (
                                                        <GalleryImageItem
                                                            key={`${url}-${i}`}
                                                            url={url}
                                                            index={i}
                                                        />
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {detail.users && (
                                        <Card className="mx-4 sm:mx-6">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <User className="size-4" />
                                                    {t('influencers.userAccount')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                                <DetailField
                                                    label={t('influencers.roleLabel')}
                                                    value={detail.users.role}
                                                />
                                                <DetailField
                                                    label={t('influencers.statusLabel')}
                                                    value={detail.users.status}
                                                />
                                                <DetailField
                                                    label={t('influencers.userEmail')}
                                                    value={detail.users.email || '—'}
                                                />
                                                <DetailField
                                                    label={t('influencers.userUuid')}
                                                    value={detail.users.uuid}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {(detail.bank_account_name || detail.bank_account_number) && (
                                        <Card className="mx-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background sm:mx-6">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Banknote className="size-4 text-emerald-500" />
                                                    {t('influencers.bankAccount')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                                <DetailField
                                                    label={t('influencers.accountName')}
                                                    value={detail.bank_account_name || '—'}
                                                />
                                                <DetailField
                                                    label={t('influencers.accountNumber')}
                                                    value={
                                                        detail.bank_account_number ? (
                                                            <span className="font-mono font-medium tracking-wider text-foreground">
                                                                {detail.bank_account_number}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )
                                                    }
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabsContent>

                                {/* TAB 2: SOCIAL ACCOUNTS & METRICS */}
                                <TabsContent value="social" className="m-0 space-y-4 pt-4">
                                    {/* Batch Fetch Action Bar */}
                                    <div className="mx-4 flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                {t('influencers.socialProfileMetrics')}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {t('influencers.linkedAccountsDesc', {
                                                    count: accounts.length,
                                                    fetchable: fetchableCount
                                                })}
                                            </p>
                                            {batchProgress && batchId ? (
                                                <p className="mt-1 text-xs font-medium text-primary">
                                                    {t('influencers.fetchingProfiles', {
                                                        finished: batchProgress.finished,
                                                        total: batchProgress.total,
                                                        failed:
                                                            batchProgress.failed > 0
                                                                ? ` · ${t('campaigns.failedCount', {
                                                                    count: batchProgress.failed
                                                                })}`
                                                                : ''
                                                    })}
                                                </p>
                                            ) : null}
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full sm:w-auto"
                                            onClick={handleRefreshAll}
                                            disabled={queueingAll || Boolean(batchId) || fetchableCount === 0}
                                        >
                                            {queueingAll || batchId ? (
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                            ) : (
                                                <Globe2Icon className="mr-2 size-4" />
                                            )}
                                            {batchId
                                                ? t('influencers.gettingMetrics')
                                                : t('influencers.getAllMetrics')}
                                        </Button>
                                    </div>

                                    {/* Linked Accounts List */}
                                    <div className="mx-4 sm:mx-6">
                                        <h3 className="mb-3 text-sm font-semibold">
                                            {t('influencers.linkedAccounts')} ({accounts.length})
                                        </h3>
                                        {accounts.length > 0 ? (
                                            <div className="grid gap-3.5 sm:grid-cols-2">
                                                {accounts.map((acc) => (
                                                    <SocialAccountCard
                                                        key={acc.uuid}
                                                        account={acc}
                                                        onClick={() => handlePlatformChange(acc.platform)}
                                                        actions={renderAccountActions(acc)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                                {t('influencers.noSocialAccountsYet')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add / Edit Social Account Form */}
                                    <div ref={formCardRef} className="mx-4 sm:mx-6">
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">
                                                    {isEditingSocial
                                                        ? t('influencers.editSocialAccount')
                                                        : t('influencers.addSocialAccount')}
                                                </CardTitle>
                                                <CardDescription>
                                                    {isEditingSocial
                                                        ? `Update profile URL and metrics for ${form.platform}`
                                                        : 'Select a platform and enter profile details'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <Label>{t('influencers.platform')} *</Label>
                                                        <Select
                                                            value={form.platform}
                                                            onValueChange={handlePlatformChange}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Platform" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availablePlatforms.map((p) => (
                                                                    <SelectItem key={p} value={p}>
                                                                        {p} {linkedPlatforms.has(p) ? '✓' : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label>{t('influencers.handleOptional')}</Label>
                                                        <Input
                                                            value={form.handle}
                                                            onChange={(e) =>
                                                                setForm({ ...form, handle: e.target.value })
                                                            }
                                                            placeholder="@username"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label>{t('influencers.profileUrl')} *</Label>
                                                    <Input
                                                        id="social_profile_url"
                                                        value={form.profile_url}
                                                        onChange={(e) =>
                                                            setForm({ ...form, profile_url: e.target.value })
                                                        }
                                                        placeholder="https://..."
                                                    />
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <Label>{t('influencers.followersCountOptional')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={form.follower_count}
                                                            onChange={(e) =>
                                                                setForm({ ...form, follower_count: e.target.value })
                                                            }
                                                            placeholder="10000"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label>{t('influencers.followingCountOptional')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={form.following_count}
                                                            onChange={(e) =>
                                                                setForm({ ...form, following_count: e.target.value })
                                                            }
                                                            placeholder="500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        onClick={handleSubmitSocial}
                                                        disabled={savingSocial || !form.profile_url.trim()}
                                                    >
                                                        {savingSocial ? (
                                                            <>
                                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                                {t('influencers.saving')}
                                                            </>
                                                        ) : (
                                                            t('influencers.save')
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    <DialogFooter className="gap-2 border-t px-4 py-3 sm:px-6">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common:close')}
                        </Button>
                        {detail && onEdit ? (
                            <Button
                                onClick={() => {
                                    onOpenChange(false)
                                    onEdit(detail)
                                }}
                            >
                                <Pencil className="mr-1.5 size-4" />
                                {t('common:edit')}
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Profile Snapshot History Dialog */}
            <ProfileMetricsHistoryDialog
                actor={actor}
                account={historyAccount}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
            />
        </>
    )
}
