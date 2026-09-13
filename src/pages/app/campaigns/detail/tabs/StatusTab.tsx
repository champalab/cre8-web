import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Bookmark,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    ExternalLink,
    Heart,
    LayoutGrid,
    LayoutList,
    Link2,
    Loader2,
    MessageCircle,
    RefreshCw,
    Search,
    Share2,
    Table2,
    TrendingUp,
    Globe2Icon
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { canAccess, INTERNAL_ROLES, isADMINRole } from '@/config/roles'
import { RootState } from '@/stores'
import { CampaignDetail, useGetCampaignInfluencersQuery } from '@/stores/services/campaignApi'
import { CampaignPostLink, useGetCampaignPostLinksQuery } from '@/stores/services/postLinksApi'
import { useFetchAllMetricsMutation, useFetchMetricsMutation, useGetMetricsBatchStatusMutation } from '@/stores/services/viewLogApi'
import { PLATFORM_META, type ActorPlatform } from '../../../influencers/components/utils'
import { formatDateTime } from '@/utils/datetime'
import ToastComponent from '@/components/ToastComponent'
import { PostLinksDialog } from '../../PostLinksDialog'

type Props = { campaign: CampaignDetail; onChanged?: () => void | Promise<unknown> }

type MetricTotals = {
    posts: number
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
}

type PlatformGroup = {
    key: string
    name: string
    links: CampaignPostLink[]
    totals: MetricTotals
}

type InfluencerGroup = {
    id: number | string
    name: string
    profile_url: string | null
    photos: string[]
    handle: string | null
    source: string | null
    links: CampaignPostLink[]
    totals: MetricTotals
    platforms: PlatformGroup[]
}

function collectPhotos(profileUrl?: string | null, profileUrls?: unknown): string[] {
    const gallery = Array.isArray(profileUrls)
        ? profileUrls.filter((url): url is string => typeof url === 'string' && url.trim() !== '')
        : []
    const primary = profileUrl?.trim()
    const photos = primary && !gallery.includes(primary) ? [primary, ...gallery] : gallery.length ? gallery : primary ? [primary] : []
    return [...new Set(photos)]
}

const PLATFORM_ORDER = ['facebook', 'instagram', 'tiktok'] as const
const STATUS_VIEW_KEY = 'influ-campaign-status-view'
const STATUS_VIEWS = ['card', 'list', 'table'] as const
type StatusView = (typeof STATUS_VIEWS)[number]

function readStatusView(): StatusView {
    try {
        const value = localStorage.getItem(STATUS_VIEW_KEY)
        if (value === 'card' || value === 'list' || value === 'table') return value
    } catch {
        // ignore
    }
    return 'card'
}

function writeStatusView(view: StatusView) {
    try {
        localStorage.setItem(STATUS_VIEW_KEY, view)
    } catch {
        // ignore
    }
}

const emptyTotals = (): MetricTotals => ({
    posts: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0
})

const formatCount = (value: number | string | null | undefined) => Number(value || 0).toLocaleString('en-US')

const addMetrics = (totals: MetricTotals, link: CampaignPostLink): MetricTotals => ({
    posts: totals.posts + 1,
    views: totals.views + Number(link.metrics?.views || 0),
    likes: totals.likes + Number(link.metrics?.likes || 0),
    comments: totals.comments + Number(link.metrics?.comments || 0),
    shares: totals.shares + Number(link.metrics?.shares || 0),
    saves: totals.saves + Number(link.metrics?.saves || 0)
})

const sumLinks = (links: CampaignPostLink[]) => links.reduce(addMetrics, emptyTotals())

const platformKey = (name?: string | null) => (name || 'other').trim().toLowerCase()

const platformMeta = (name?: string | null, otherLabel = 'Other') => {
    const key = platformKey(name) as ActorPlatform
    return PLATFORM_META[key] || {
        label: name || otherLabel,
        short: (name || '?').slice(0, 2).toUpperCase(),
        iconClass: 'bg-muted text-foreground',
        panelClass: ''
    }
}

const MetricChip: React.FC<{ icon: React.ReactNode; label: string; value: number; className?: string }> = ({
    icon,
    label,
    value,
    className
}) => (
    <div className={`flex min-w-0 items-center gap-1.5 rounded-lg border bg-background/80 px-2 py-1.5 ${className || ''}`}>
        {icon}
        <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-sm font-bold tabular-nums leading-tight">{formatCount(value)}</p>
        </div>
    </div>
)

const CompactMetric: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" title={label}>
        {icon}
        <span className="tabular-nums font-medium text-foreground">{formatCount(value)}</span>
    </span>
)

const StatBox: React.FC<{
    icon: React.ReactNode
    label: string
    value: number
    tone: string
}> = ({ icon, label, value, tone }) => (
    <div className={`rounded-xl border px-2.5 py-2.5 ${tone}`}>
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
            {icon}
            {label}
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums leading-none tracking-tight sm:text-2xl">{formatCount(value)}</p>
    </div>
)

const InfluencerPhotos: React.FC<{
    name: string
    subtitle?: string
    photos: string[]
    onPreview: (url: string) => void
}> = ({ name, subtitle, photos, onPreview }) => {
    const { t } = useTranslation('app')
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const count = photos.length

    useEffect(() => {
        if (count < 2 || paused) return
        const timer = window.setInterval(() => {
            setActive((index) => (index + 1) % count)
        }, 4200)
        return () => window.clearInterval(timer)
    }, [count, paused])

    const goTo = (index: number) => {
        if (!count) return
        setActive((index + count) % count)
    }

    return (
        <div
            className="group/carousel relative overflow-hidden bg-muted"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                {count > 0 ? (
                    <div
                        className="flex h-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${active * 100}%)` }}
                    >
                        {photos.map((url, index) => (
                            <button
                                key={`${url}-${index}`}
                                type="button"
                                className="h-full w-full shrink-0 cursor-zoom-in"
                                onClick={() => onPreview(url)}
                            >
                                <img src={url} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange/10 to-black/10">
                        <span className="text-6xl font-bold text-primary/35">{name.slice(0, 1).toUpperCase()}</span>
                    </div>
                )}

                {count > 1 && (
                    <>
                        <button
                            type="button"
                            className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 shadow-lg backdrop-blur-md transition-all hover:bg-black/60 group-hover/carousel:opacity-100"
                            onClick={(event) => {
                                event.stopPropagation()
                                goTo(active - 1)
                            }}
                            aria-label={t('statusTab.previousPhoto')}
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 shadow-lg backdrop-blur-md transition-all hover:bg-black/60 group-hover/carousel:opacity-100"
                            onClick={(event) => {
                                event.stopPropagation()
                                goTo(active + 1)
                            }}
                            aria-label={t('statusTab.nextPhoto')}
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    </>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-16 text-left text-white">
                    <h3 className="truncate text-base font-semibold leading-tight">{name}</h3>
                    {(subtitle || count > 1) && (
                        <p className="mt-0.5 truncate text-[11px] text-white/75">
                            {[subtitle, count > 1 ? `${active + 1}/${count}` : null].filter(Boolean).join(' · ')}
                        </p>
                    )}
                    {count > 1 && (
                        <div className="pointer-events-auto mt-2 flex items-center justify-center gap-1.5">
                            {photos.map((url, index) => (
                                <button
                                    key={`dot-${url}-${index}`}
                                    type="button"
                                    className={`h-1.5 rounded-full transition-all ${index === active ? 'w-5 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
                                        }`}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        goTo(index)
                                    }}
                                    aria-label={t('statusTab.photoIndex', { index: index + 1 })}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const StatusTab: React.FC<Props> = ({ campaign, onChanged }) => {
    const { t, i18n } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canGetMetrics = canAccess(auth.role, INTERNAL_ROLES)
    const isAdmin = isADMINRole(auth.role)
    const campaignUuid = campaign.uuid || ''
    const getPlatformMeta = (name?: string | null) => platformMeta(name, t('statusTab.other'))

    const [searchQuery, setSearchQuery] = useState('')
    const [platformFilter, setPlatformFilter] = useState('all')
    const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [batchProgress, setBatchProgress] = useState<{ total: number; finished: number; failed: number } | null>(null)
    const [fetchingLinkIds, setFetchingLinkIds] = useState<number[]>([])
    const [fetchingGroupId, setFetchingGroupId] = useState<number | string | null>(null)
    const [postLinksOpen, setPostLinksOpen] = useState(false)
    const [postLinksActorId, setPostLinksActorId] = useState<number | null>(null)
    const [detailGroupId, setDetailGroupId] = useState<number | string | null>(null)
    const [viewMode, setViewMode] = useState<StatusView>(readStatusView)

    const changeView = (view: StatusView) => {
        setViewMode(view)
        writeStatusView(view)
    }

    const openPostLinks = (actorId?: number | null) => {
        setPostLinksActorId(actorId ?? null)
        setPostLinksOpen(true)
    }

    const { data: linksRes, isLoading, isFetching, refetch } = useGetCampaignPostLinksQuery(
        { campaign_uuid: campaignUuid, page: 1, limit: 500 },
        { skip: !campaignUuid }
    )
    const { data: influencersRes } = useGetCampaignInfluencersQuery(campaignUuid, { skip: !campaignUuid })
    const [fetchAllMetrics, { isLoading: isQueueing }] = useFetchAllMetricsMutation()
    const [fetchMetrics] = useFetchMetricsMutation()
    const [getBatchStatus] = useGetMetricsBatchStatusMutation()
    const isBatchRunning = isQueueing || Boolean(batchId)

    const links = useMemo(() => {
        const items = linksRes?.data?.items
        return Array.isArray(items) ? items : []
    }, [linksRes])
    const influencers = influencersRes?.data ?? []

    const platformOptions = useMemo(() => {
        const names = new Map<string, string>()
        for (const link of links) {
            const key = platformKey(link.platform?.name)
            names.set(key, link.platform?.name || t('statusTab.other'))
        }
        return [...names.entries()].sort((a, b) => {
            const aIndex = PLATFORM_ORDER.indexOf(a[0] as (typeof PLATFORM_ORDER)[number])
            const bIndex = PLATFORM_ORDER.indexOf(b[0] as (typeof PLATFORM_ORDER)[number])
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
        })
    }, [i18n.language, links, t])

    const groups = useMemo<InfluencerGroup[]>(() => {
        const map = new Map<number | string, InfluencerGroup>()

        for (const link of links) {
            const assignment = influencers.find((item) => item.actor_id === link.influencer?.id)
            const actor = assignment?.actor
            const id = link.influencer?.id ?? `unknown-${link.uuid}`
            const existing = map.get(id)
            if (existing) {
                existing.links.push(link)
                continue
            }
            map.set(id, {
                id,
                name: actor?.name || link.influencer?.name || t('statusTab.fallbackInfluencer'),
                profile_url: actor?.profile_url || link.influencer?.profile_url || null,
                photos: collectPhotos(actor?.profile_url || link.influencer?.profile_url, actor?.profile_urls),
                handle: actor?.social_handle || null,
                source: actor?.source || null,
                links: [link],
                totals: emptyTotals(),
                platforms: []
            })
        }

        return [...map.values()]
            .map((group) => {
                const platformMap = new Map<string, CampaignPostLink[]>()
                for (const link of group.links) {
                    const key = platformKey(link.platform?.name)
                    const current = platformMap.get(key) || []
                    current.push(link)
                    platformMap.set(key, current)
                }
                const platforms = [...platformMap.entries()]
                    .sort((a, b) => {
                        const aIndex = PLATFORM_ORDER.indexOf(a[0] as (typeof PLATFORM_ORDER)[number])
                        const bIndex = PLATFORM_ORDER.indexOf(b[0] as (typeof PLATFORM_ORDER)[number])
                        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
                    })
                    .map(([key, platformLinks]) => ({
                        key,
                        name: platformLinks[0]?.platform?.name || t('statusTab.other'),
                        links: platformLinks,
                        totals: sumLinks(platformLinks)
                    }))
                return { ...group, totals: sumLinks(group.links), platforms }
            })
            .sort((a, b) => b.totals.views - a.totals.views || a.name.localeCompare(b.name))
    }, [i18n.language, influencers, links, t])

    const filteredGroups = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return groups
            .map((group) => {
                const platforms =
                    platformFilter === 'all' ? group.platforms : group.platforms.filter((platform) => platform.key === platformFilter)
                const visibleLinks = platforms.flatMap((platform) => platform.links)
                return {
                    ...group,
                    platforms,
                    links: visibleLinks,
                    totals: sumLinks(visibleLinks)
                }
            })
            .filter((group) => {
                if (!group.platforms.length) return false
                if (!query) return true
                return (
                    group.name.toLowerCase().includes(query) ||
                    (group.handle || '').toLowerCase().includes(query) ||
                    group.links.some((link) => link.post_url.toLowerCase().includes(query))
                )
            })
    }, [groups, platformFilter, searchQuery])

    const campaignTotals = useMemo(
        () => sumLinks(filteredGroups.flatMap((group) => group.links)),
        [filteredGroups]
    )
    const detailGroup = filteredGroups.find((group) => String(group.id) === String(detailGroupId)) ?? null
    const platformTotals = useMemo(() => {
        const map = new Map<string, { key: string; name: string; totals: MetricTotals }>()
        for (const group of filteredGroups) {
            for (const platform of group.platforms) {
                const current = map.get(platform.key)
                if (!current) {
                    map.set(platform.key, { key: platform.key, name: platform.name, totals: { ...platform.totals } })
                    continue
                }
                current.totals = {
                    posts: current.totals.posts + platform.totals.posts,
                    views: current.totals.views + platform.totals.views,
                    likes: current.totals.likes + platform.totals.likes,
                    comments: current.totals.comments + platform.totals.comments,
                    shares: current.totals.shares + platform.totals.shares,
                    saves: current.totals.saves + platform.totals.saves
                }
            }
        }
        return [...map.values()]
    }, [filteredGroups])


    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link)
        ToastComponent({ status: 'success', message: t('statusTab.linkCopied') })
    }
    useEffect(() => {
        if (!batchId) return
        let cancelled = false
        const checkStatus = async () => {
            try {
                const response = await getBatchStatus(batchId).unwrap()
                if (cancelled) return
                const status = response.data
                setBatchProgress({ total: status.total, finished: status.finished, failed: status.failed })
                if (status.done) {
                    setBatchId(null)
                    setFetchingGroupId(null)
                    setFetchingLinkIds([])
                    await refetch()
                    await Promise.resolve(onChanged?.())
                    ToastComponent({
                        status: status.failed ? 'warning' : 'success',
                        message: status.failed
                            ? t('statusTab.fetchedPartial', {
                                completed: status.completed,
                                total: status.total,
                                failed: status.failed
                            })
                            : t('statusTab.fetchedAll', { completed: status.completed })
                    })
                }
            } catch {
                // Keep polling through temporary status failures.
            }
        }
        void checkStatus()
        const interval = window.setInterval(checkStatus, 2500)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [batchId, getBatchStatus, onChanged, refetch, t])

    const markLinkFetching = (postLinkId: number, active: boolean) => {
        setFetchingLinkIds((current) =>
            active ? [...new Set([...current, postLinkId])] : current.filter((id) => id !== postLinkId)
        )
    }

    const handleGetLinkMetrics = async (postLinkId: number) => {
        markLinkFetching(postLinkId, true)
        try {
            await fetchMetrics(postLinkId).unwrap()
            await refetch()
            await Promise.resolve(onChanged?.())
            ToastComponent({ status: 'success', message: t('statusTab.metricsUpdated') })
        } catch (error: any) {
            ToastComponent({ status: 'error', message: error?.data?.message || t('statusTab.unableToGetMetricsPost') })
        } finally {
            markLinkFetching(postLinkId, false)
        }
    }

    const handleGetInfluencerMetrics = async (group: InfluencerGroup) => {
        const ids = group.links.map((link) => link.id)
        if (!ids.length) return
        setFetchingGroupId(group.id)
        ids.forEach((id) => markLinkFetching(id, true))
        try {
            const response = await fetchAllMetrics({ post_link_ids: ids }).unwrap()
            if (!response.data.queued) {
                setFetchingGroupId(null)
                ids.forEach((id) => markLinkFetching(id, false))
                return ToastComponent({ status: 'warning', message: t('statusTab.noSupportedLinks') })
            }
            setBatchProgress({ total: response.data.queued, finished: 0, failed: 0 })
            setBatchId(response.data.batch_id)
            ToastComponent({
                status: 'success',
                message: t('statusTab.queuedPosts', { queued: response.data.queued }),
            })
        } catch (error: any) {
            setFetchingGroupId(null)
            ids.forEach((id) => markLinkFetching(id, false))
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('statusTab.unableToGetMetricsInfluencer'),
            })
        }
    }

    const handleGetCampaignMetrics = async () => {
        try {
            const response = await fetchAllMetrics({ campaign_id: campaign.id }).unwrap()
            if (!response.data.queued) {
                return ToastComponent({ status: 'warning', message: t('statusTab.noSupportedLinksCampaign') })
            }
            setBatchProgress({ total: response.data.queued, finished: 0, failed: 0 })
            setBatchId(response.data.batch_id)
            ToastComponent({ status: 'success', message: t('statusTab.startedGettingMetrics', { queued: response.data.queued }) })
        } catch (error: any) {
            ToastComponent({ status: 'error', message: error?.data?.message || t('statusTab.unableToGetMetrics') })
        }
    }

    return (
        <div className="space-y-5">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-black via-black to-orange text-white shadow-xl shadow-orange/15">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{t('statusTab.campaignStatus')}</p>
                            <h2 className="mt-1 text-xl font-bold sm:text-2xl">{t('statusTab.postPerformance')}</h2>
                            <p className="mt-1 max-w-xl text-sm text-white/75">
                                {t('statusTab.postPerformanceDesc')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {canGetMetrics && (
                                <Button
                                    className="bg-white text-primary hover:bg-white/90"
                                    onClick={handleGetCampaignMetrics}
                                    disabled={isBatchRunning || fetchingLinkIds.length > 0}
                                >
                                    {isBatchRunning ? <Loader2 className="size-4 animate-spin" /> : <Globe2Icon className="size-4" />}
                                    {t('campaignDetail.refreshMetrics')}  
                                </Button>
                            )}

                        </div>
                    </div>
                    {batchProgress && batchId && (
                        <p className="mt-3 text-xs text-white/70">
                            {t('statusTab.updating', { finished: batchProgress.finished, total: batchProgress.total })}
                            {batchProgress.failed ? ` · ${t('statusTab.failed', { failed: batchProgress.failed })}` : ''}
                        </p>
                    )}
                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <MetricChip icon={<Link2 className="size-4 text-sky-200" />} label={t('statusTab.posts')} value={campaignTotals.posts} className="border-white/15 bg-white/10 text-white" />
                        <MetricChip icon={<Eye className="size-4 text-sky-200" />} label={t('metrics.views')} value={campaignTotals.views} className="border-white/15 bg-white/10 text-white" />
                        <MetricChip icon={<Heart className="size-4 text-rose-200" />} label={t('metrics.likes')} value={campaignTotals.likes} className="border-white/15 bg-white/10 text-white" />
                        <MetricChip icon={<MessageCircle className="size-4 text-violet-200" />} label={t('metrics.comments')} value={campaignTotals.comments} className="border-white/15 bg-white/10 text-white" />
                        <MetricChip icon={<Share2 className="size-4 text-emerald-200" />} label={t('metrics.shares')} value={campaignTotals.shares} className="border-white/15 bg-white/10 text-white" />
                        <MetricChip icon={<Bookmark className="size-4 text-amber-200" />} label={t('metrics.saves')} value={campaignTotals.saves} className="border-white/15 bg-white/10 text-white" />
                    </div>
                </CardContent>
            </Card>

            {platformTotals.length > 0 && viewMode === 'card' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {platformTotals.map((platform) => {
                        const meta = getPlatformMeta(platform.name)
                        return (
                            <button
                                key={platform.key}
                                type="button"
                                onClick={() => setPlatformFilter(platformFilter === platform.key ? 'all' : platform.key)}
                                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${platformFilter === platform.key
                                    ? 'border-primary ring-1 ring-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-gradient-to-br from-primary/5 via-background to-background scale-[1.02]'
                                    : 'bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1'
                                    }`}
                            >
                                {/* Subtle background glow when selected */}
                                {platformFilter === platform.key && (
                                    <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/20 blur-3xl transition-opacity" />
                                )}

                                <div className="relative flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex size-11 items-center justify-center rounded-xl shadow-sm ring-1 ring-white/10 ${meta.iconClass}`}>
                                            <span className="text-sm font-bold tracking-wider">{meta.short}</span>
                                        </span>
                                        <div>
                                            <p className="text-base font-bold text-foreground">{meta.label}</p>
                                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                                {platform.totals.posts} {t('statusTab.posts')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`transition-all duration-300 ${platformFilter === platform.key ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                                        <CheckCircle2 className="size-5 text-primary" />
                                    </div>
                                </div>

                                <div className="relative mt-5 grid grid-cols-4 gap-2 divide-x divide-border/50 rounded-xl bg-muted/30 p-3 shadow-inner">
                                    <div className="flex flex-col items-center justify-center px-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
                                            <Eye className="size-3.5" />
                                        </div>
                                        <p className="mt-1.5 font-bold tabular-nums text-foreground">{formatCount(platform.totals.views)}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-rose-500">
                                            <Heart className="size-3.5" />
                                        </div>
                                        <p className="mt-1.5 font-bold tabular-nums text-foreground">{formatCount(platform.totals.likes)}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-violet-500">
                                            <MessageCircle className="size-3.5" />
                                        </div>
                                        <p className="mt-1.5 font-bold tabular-nums text-foreground">{formatCount(platform.totals.comments)}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center px-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-emerald-500">
                                            <Share2 className="size-3.5" />
                                        </div>
                                        <p className="mt-1.5 font-bold tabular-nums text-foreground">{formatCount(platform.totals.shares)}</p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {platformTotals.length > 0 && viewMode === 'list' && (
                <div className="space-y-2">
                    {platformTotals.map((platform) => {
                        const meta = getPlatformMeta(platform.name)
                        return (
                            <button
                                key={platform.key}
                                type="button"
                                onClick={() => setPlatformFilter(platformFilter === platform.key ? 'all' : platform.key)}
                                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${platformFilter === platform.key
                                    ? 'border-primary bg-primary/5'
                                    : 'bg-card hover:border-primary/40'
                                    }`}
                            >
                                <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${meta.iconClass}`}>
                                    {meta.short}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{meta.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{t('statusTab.postsCount', { count: platform.totals.posts })}</p>
                                </div>
                                <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {formatCount(platform.totals.views)}</span>
                                    <span className="inline-flex items-center gap-1"><Heart className="size-3" /> {formatCount(platform.totals.likes)}</span>
                                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" /> {formatCount(platform.totals.comments)}</span>
                                    <span className="inline-flex items-center gap-1"><Share2 className="size-3" /> {formatCount(platform.totals.shares)}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {platformTotals.length > 0 && viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 font-medium">{t('statusTab.platform')}</th>
                                <th className="px-3 py-2 font-medium">{t('statusTab.posts')}</th>
                                <th className="px-3 py-2 font-medium">{t('metrics.views')}</th>
                                <th className="px-3 py-2 font-medium">{t('metrics.likes')}</th>
                                <th className="px-3 py-2 font-medium">{t('metrics.comments')}</th>
                                <th className="px-3 py-2 font-medium">{t('metrics.shares')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platformTotals.map((platform) => {
                                const meta = getPlatformMeta(platform.name)
                                return (
                                    <tr
                                        key={platform.key}
                                        className={`cursor-pointer border-t hover:bg-muted/40 ${platformFilter === platform.key ? 'bg-primary/5' : ''
                                            }`}
                                        onClick={() => setPlatformFilter(platformFilter === platform.key ? 'all' : platform.key)}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex size-7 items-center justify-center rounded-md text-[10px] font-bold ${meta.iconClass}`}>
                                                    {meta.short}
                                                </span>
                                                <span className="font-medium">{meta.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{formatCount(platform.totals.posts)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatCount(platform.totals.views)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatCount(platform.totals.likes)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatCount(platform.totals.comments)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatCount(platform.totals.shares)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t('statusTab.searchPlaceholder')}
                        className="h-9 pl-8 text-xs"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                        type="button"
                        size="sm"
                        variant={platformFilter === 'all' ? 'default' : 'outline'}
                        className="h-9"
                        onClick={() => setPlatformFilter('all')}
                    >
                        {t('statusTab.allPlatforms')}
                    </Button>
                    {platformOptions.map(([key, name]) => {
                        const meta = getPlatformMeta(name)
                        return (
                            <Button
                                key={key}
                                type="button"
                                size="sm"
                                variant={platformFilter === key ? 'default' : 'outline'}
                                className="h-9"
                                onClick={() => setPlatformFilter(key)}
                            >
                                {meta.label}
                            </Button>
                        )
                    })}
                    <div className="ml-auto flex items-center rounded-xl border bg-background p-0.5">
                        {(
                            [
                                { id: 'card' as const, label: t('statusTab.viewCard'), icon: LayoutGrid },
                                { id: 'list' as const, label: t('statusTab.viewList'), icon: LayoutList },
                                { id: 'table' as const, label: t('statusTab.viewTable'), icon: Table2 }
                            ]
                        ).map((option) => (
                            <Button
                                key={option.id}
                                type="button"
                                size="sm"
                                variant={viewMode === option.id ? 'default' : 'ghost'}
                                className="h-8 gap-1.5 px-2.5 text-xs"
                                onClick={() => changeView(option.id)}
                                title={t('statusTab.viewModeTitle', { label: option.label })}
                            >
                                <option.icon className="size-3.5" />
                                <span className="hidden sm:inline">{option.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    {t('statusTab.loading')}
                </div>
            ) : filteredGroups.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <TrendingUp className="mb-3 size-10 text-muted-foreground/30" />
                        <h3 className="text-base font-semibold">{t('statusTab.emptyTitle')}</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {searchQuery.trim() || platformFilter !== 'all'
                                ? t('statusTab.emptyFilter')
                                : t('statusTab.emptyHint')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {isFetching && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> {t('statusTab.updatingMetrics')}
                        </p>
                    )}
                    {viewMode === 'card' && (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredGroups.map((group) => (
                                <Card key={String(group.id)} className="overflow-hidden border-border/70">
                                    <InfluencerPhotos
                                        name={group.name}
                                        subtitle={[group.handle, t('statusTab.postsCount', { count: group.totals.posts })]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        photos={group.photos}
                                        onPreview={(url) => setPreviewPhoto({ url, name: group.name })}
                                    />
                                    <CardContent className="space-y-3 p-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <StatBox icon={<Eye className="size-3.5" />} label={t('metrics.views')} value={group.totals.views} tone="border-sky-200 bg-sky-50 text-sky-900" />
                                            <StatBox icon={<Heart className="size-3.5" />} label={t('metrics.likes')} value={group.totals.likes} tone="border-rose-200 bg-rose-50 text-rose-900" />
                                            <StatBox icon={<MessageCircle className="size-3.5" />} label={t('metrics.comments')} value={group.totals.comments} tone="border-violet-200 bg-violet-50 text-violet-900" />
                                            <StatBox icon={<Share2 className="size-3.5" />} label={t('metrics.shares')} value={group.totals.shares} tone="border-emerald-200 bg-emerald-50 text-emerald-900" />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8 flex-1 text-xs"
                                                onClick={() => setDetailGroupId(group.id)}
                                            >
                                                {t('statusTab.viewDetails')}
                                                <ChevronRight className="size-3.5" />
                                            </Button>
                                            {canGetMetrics && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8"
                                                    disabled={isBatchRunning || fetchingGroupId === group.id}
                                                    onClick={() => handleGetInfluencerMetrics(group)}
                                                >
                                                    {fetchingGroupId === group.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Globe2Icon className="size-3.5" />
                                                    )}
                                                </Button>
                                            )}
                                            {isAdmin && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    onClick={() => openPostLinks(typeof group.id === 'number' ? group.id : null)}
                                                    title={t('statusTab.addPostLink')}
                                                >
                                                    <Link2 className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="space-y-2">
                            {filteredGroups.map((group) => (
                                <div key={String(group.id)} className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
                                    <button
                                        type="button"
                                        className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                                        onClick={() => group.photos[0] && setPreviewPhoto({ url: group.photos[0], name: group.name })}
                                    >
                                        {group.photos[0] ? (
                                            <img src={group.photos[0]} alt={group.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-lg font-bold text-primary/40">
                                                {group.name.slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{group.name}</p>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {[group.handle, t('statusTab.postsCount', { count: group.totals.posts }), group.platforms.map((p) => getPlatformMeta(p.name).label).join(', ')]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                            <span className="inline-flex items-center gap-1"><Eye className="size-3" /> {formatCount(group.totals.views)}</span>
                                            <span className="inline-flex items-center gap-1"><Heart className="size-3" /> {formatCount(group.totals.likes)}</span>
                                            <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" /> {formatCount(group.totals.comments)}</span>
                                            <span className="inline-flex items-center gap-1"><Share2 className="size-3" /> {formatCount(group.totals.shares)}</span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button type="button" size="sm" className="h-8 text-xs" onClick={() => setDetailGroupId(group.id)}>
                                            {t('statusTab.details')}
                                        </Button>
                                        {canGetMetrics && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                disabled={isBatchRunning || fetchingGroupId === group.id}
                                                onClick={() => handleGetInfluencerMetrics(group)}
                                            >
                                                {fetchingGroupId === group.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                                            </Button>
                                        )}
                                        {isAdmin && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => openPostLinks(typeof group.id === 'number' ? group.id : null)}
                                                title={t('statusTab.addPostLink')}
                                            >
                                                <Link2 className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'table' && (
                        <div className="overflow-x-auto rounded-xl border">
                            <table className="w-full min-w-[48rem] text-left text-sm">
                                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">{t('statusTab.influencer')}</th>
                                        <th className="px-3 py-2 font-medium">{t('statusTab.platform')}</th>
                                        <th className="px-3 py-2 font-medium">{t('statusTab.posts')}</th>
                                        <th className="px-3 py-2 font-medium">{t('metrics.views')}</th>
                                        <th className="px-3 py-2 font-medium">{t('metrics.likes')}</th>
                                        <th className="px-3 py-2 font-medium">{t('metrics.comments')}</th>
                                        <th className="px-3 py-2 font-medium">{t('metrics.shares')}</th>
                                        <th className="px-3 py-2 font-medium text-right">{t('common:actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroups.map((group) => (
                                        <tr key={String(group.id)} className="border-t hover:bg-muted/30">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    {group.photos[0] ? (
                                                        <img src={group.photos[0]} alt="" className="size-9 rounded-md object-cover" />
                                                    ) : (
                                                        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                                            {group.name.slice(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">{group.name}</p>
                                                        {group.handle ? <p className="truncate text-[11px] text-muted-foreground">{group.handle}</p> : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-xs">{group.platforms.map((p) => getPlatformMeta(p.name).label).join(', ')}</td>
                                            <td className="px-3 py-2 tabular-nums">{formatCount(group.totals.posts)}</td>
                                            <td className="px-3 py-2 tabular-nums font-medium">{formatCount(group.totals.views)}</td>
                                            <td className="px-3 py-2 tabular-nums">{formatCount(group.totals.likes)}</td>
                                            <td className="px-3 py-2 tabular-nums">{formatCount(group.totals.comments)}</td>
                                            <td className="px-3 py-2 tabular-nums">{formatCount(group.totals.shares)}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-1">
                                                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDetailGroupId(group.id)}>
                                                        {t('statusTab.details')}
                                                    </Button>
                                                    {canGetMetrics && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7"
                                                            disabled={isBatchRunning || fetchingGroupId === group.id}
                                                            onClick={() => handleGetInfluencerMetrics(group)}
                                                        >
                                                            {fetchingGroupId === group.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2"
                                                            onClick={() => openPostLinks(typeof group.id === 'number' ? group.id : null)}
                                                            title={t('statusTab.addPostLink')}
                                                        >
                                                            <Link2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={Boolean(detailGroup)} onOpenChange={(open) => !open && setDetailGroupId(null)}>
                <DialogContent className="flex max-h-[90vh] w-[min(48rem,calc(100vw-1.5rem))] max-w-3xl flex-col gap-4 overflow-hidden p-6">
                    {detailGroup && (
                        <>
                            <DialogHeader className="shrink-0 pr-8">
                                <div className="flex items-center gap-3">
                                    {detailGroup.photos[0] ? (
                                        <img
                                            src={detailGroup.photos[0]}
                                            alt={detailGroup.name}
                                            className="size-14 shrink-0 cursor-zoom-in rounded-xl object-cover"
                                            onClick={() => setPreviewPhoto({ url: detailGroup.photos[0], name: detailGroup.name })}
                                        />
                                    ) : (
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                                            {detailGroup.name.slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <DialogTitle className="truncate">{detailGroup.name}</DialogTitle>
                                        <DialogDescription>
                                            {[detailGroup.handle, t('statusTab.postsCount', { count: detailGroup.totals.posts })]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </DialogDescription>
                                    </div>
                                </div>
                                {detailGroup.photos.length > 1 && (
                                    <div className="mt-3 flex gap-1.5 overflow-x-auto">
                                        {detailGroup.photos.map((url) => (
                                            <button
                                                key={url}
                                                type="button"
                                                className="size-12 shrink-0 overflow-hidden rounded-lg border"
                                                onClick={() => setPreviewPhoto({ url, name: detailGroup.name })}
                                            >
                                                <img src={url} alt="" className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <StatBox icon={<Eye className="size-3.5" />} label={t('metrics.views')} value={detailGroup.totals.views} tone="border-sky-200 bg-sky-50 text-sky-900" />
                                    <StatBox icon={<Heart className="size-3.5" />} label={t('metrics.likes')} value={detailGroup.totals.likes} tone="border-rose-200 bg-rose-50 text-rose-900" />
                                    <StatBox icon={<MessageCircle className="size-3.5" />} label={t('metrics.comments')} value={detailGroup.totals.comments} tone="border-violet-200 bg-violet-50 text-violet-900" />
                                    <StatBox icon={<Share2 className="size-3.5" />} label={t('metrics.shares')} value={detailGroup.totals.shares} tone="border-emerald-200 bg-emerald-50 text-emerald-900" />
                                </div>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
                                {detailGroup.platforms.map((platform) => {
                                    const meta = getPlatformMeta(platform.name)
                                    return (
                                        <div key={platform.key} className="rounded-2xl border bg-muted/20 p-3">
                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex size-6 items-center justify-center rounded-md text-[10px] font-bold ${meta.iconClass}`}>
                                                        {meta.short}
                                                    </span>
                                                    <p className="text-sm font-semibold">{meta.label}</p>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {t('statusTab.postsCount', { count: platform.totals.posts })}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Eye className="size-3" /> {formatCount(platform.totals.views)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Heart className="size-3" /> {formatCount(platform.totals.likes)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <MessageCircle className="size-3" /> {formatCount(platform.totals.comments)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Share2 className="size-3" /> {formatCount(platform.totals.shares)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {platform.links.map((link) => (
                                                    <div key={link.uuid} className="rounded-xl border bg-background p-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                                                                    {link.media_type === 'photo' ? t('postLinksDialog.photo') : t('postLinksDialog.video')}
                                                                </Badge>
                                                                <a
                                                                    href={link.post_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                                >
                                                                    <span className="truncate">{link.post_url}</span>
                                                                    <ExternalLink className="size-3 shrink-0" />
                                                                </a>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 shrink-0 text-xs"
                                                                    onClick={() => handleCopyLink(link.post_url)}
                                                                >
                                                                    <Copy className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                            {canGetMetrics && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 shrink-0 text-xs"
                                                                    disabled={isBatchRunning || fetchingLinkIds.includes(link.id)}
                                                                    onClick={() => handleGetLinkMetrics(link.id)}
                                                                >
                                                                    {fetchingLinkIds.includes(link.id) ? (
                                                                        <Loader2 className="size-3.5 animate-spin" />
                                                                    ) : (
                                                                        <RefreshCw className="size-3.5" />
                                                                    )}
                                                                    {t('statusTab.getMetrics')}
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                                            {link.media_type !== 'photo' && (
                                                                <CompactMetric icon={<Eye className="size-3 text-sky-600" />} label={t('metrics.views')} value={Number(link.metrics?.views || 0)} />
                                                            )}
                                                            <CompactMetric icon={<Heart className="size-3 text-rose-600" />} label={t('metrics.likes')} value={Number(link.metrics?.likes || 0)} />
                                                            <CompactMetric icon={<MessageCircle className="size-3 text-violet-600" />} label={t('metrics.comments')} value={Number(link.metrics?.comments || 0)} />
                                                            <CompactMetric icon={<Share2 className="size-3 text-emerald-600" />} label={t('metrics.shares')} value={Number(link.metrics?.shares || 0)} />
                                                            <CompactMetric icon={<Bookmark className="size-3 text-amber-600" />} label={t('metrics.saves')} value={Number(link.metrics?.saves || 0)} />
                                                        </div>
                                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                                            {t('statusTab.lastChecked', { datetime: formatDateTime(link.metrics?.checked_at) })}
                                                            {link.metrics?.source ? ` · ${link.metrics.source}` : ''}
                                                            {link.metrics_error ? ` · ${link.metrics_error}` : ''}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(previewPhoto)} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
                <DialogContent className="max-w-2xl overflow-hidden p-0">
                    {previewPhoto && (
                        <img src={previewPhoto.url} alt={previewPhoto.name} className="max-h-[80vh] w-full object-contain bg-black" />
                    )}
                </DialogContent>
            </Dialog>

            <PostLinksDialog
                campaign={campaign}
                open={postLinksOpen}
                defaultActorId={postLinksActorId}
                onOpenChange={(next) => {
                    setPostLinksOpen(next)
                    if (!next) {
                        setPostLinksActorId(null)
                        void refetch()
                        void onChanged?.()
                    }
                }}
            />
        </div>
    )
}

export default StatusTab
