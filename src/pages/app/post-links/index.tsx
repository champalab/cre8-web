import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Link2,
    Loader2,
    RefreshCw,
    Search,
    Sparkles
} from 'lucide-react'
import BackdropComponent from '@/components/BackdropComponent'
import PaginationComponent from '@/components/PaginationComponent'
import ToastComponent from '@/components/ToastComponent'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
    useGetPostLinksMonitorQuery,
    type PostLinksMonitorMetricsStatus
} from '@/stores/services/postLinksApi'
import {
    useFetchAllMetricsMutation,
    useFetchMetricsMutation,
    useGetMetricsBatchStatusMutation,
    useGetViewLogCampaignsQuery
} from '@/stores/services/viewLogApi'
import { formatDateTime } from '@/utils/datetime'

const STATUS_OPTIONS: PostLinksMonitorMetricsStatus[] = ['all', 'error', 'ok', 'pending']

function formatMetric(value: number | null | undefined) {
    return value == null ? '—' : Number(value).toLocaleString()
}

function SummaryCard({
    label,
    value,
    tone,
    active,
    onClick,
    icon
}: {
    label: string
    value: number
    tone: 'default' | 'destructive' | 'success' | 'muted'
    active: boolean
    onClick: () => void
    icon: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                active ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'bg-card'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span
                    className={cn(
                        'rounded-lg p-1.5',
                        tone === 'destructive' && 'bg-destructive/10 text-destructive',
                        tone === 'success' && 'bg-emerald-500/10 text-emerald-600',
                        tone === 'muted' && 'bg-muted text-muted-foreground',
                        tone === 'default' && 'bg-primary/10 text-primary'
                    )}
                >
                    {icon}
                </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
        </button>
    )
}

export default function PostLinksMonitorPage() {
    const { t } = useTranslation('app')
    const [page, setPage] = useState(1)
    const [campaignId, setCampaignId] = useState<number | undefined>()
    const [metricsStatus, setMetricsStatus] = useState<PostLinksMonitorMetricsStatus>('all')
    const [searchInput, setSearchInput] = useState('')
    const [searchQ, setSearchQ] = useState('')
    const [fetchingIds, setFetchingIds] = useState<number[]>([])
    const [batchId, setBatchId] = useState<string | null>(null)

    const { data: campaignsRes, isLoading: campaignsLoading } = useGetViewLogCampaignsQuery()
    const campaigns = campaignsRes?.status === 'success' ? campaignsRes.data : []

    const { data: monitorRes, isFetching, isError, refetch } = useGetPostLinksMonitorQuery({
        page,
        limit: 25,
        campaign_id: campaignId,
        metrics_status: metricsStatus,
        q: searchQ.trim() || undefined
    })

    const payload = monitorRes?.status === 'success' ? monitorRes.data : null
    const rows = payload?.items ?? []
    const summary = payload?.summary ?? { total: 0, error: 0, ok: 0, pending: 0 }
    const pagination = payload?.pagination ?? { totalItems: 0, totalPages: 0, page: 1, limit: 25, total: 0 }

    const [fetchMetrics] = useFetchMetricsMutation()
    const [fetchAllMetrics, { isLoading: queueingBatch }] = useFetchAllMetricsMutation()
    const [getBatchStatus] = useGetMetricsBatchStatusMutation()

    const isBatchRunning = Boolean(batchId) || queueingBatch

    useEffect(() => {
        if (!batchId) return
        let cancelled = false
        const tick = async () => {
            try {
                const res = await getBatchStatus(batchId).unwrap()
                if (cancelled) return
                if (res.data.done) {
                    setBatchId(null)
                    await refetch()
                    ToastComponent({ status: 'success', message: t('postLinksMonitor.batchDone') })
                }
            } catch {
                if (!cancelled) setBatchId(null)
            }
        }
        const id = window.setInterval(tick, 2500)
        tick()
        return () => {
            cancelled = true
            window.clearInterval(id)
        }
    }, [batchId, getBatchStatus, refetch, t])

    const applySearch = () => {
        const next = searchInput.trim()
        setSearchQ(next)
        setPage(1)
    }

    const clearSearch = () => {
        setSearchInput('')
        setSearchQ('')
        setPage(1)
    }

    const handleFetchOne = async (postLinkId: number) => {
        setFetchingIds((prev) => [...new Set([...prev, postLinkId])])
        try {
            await fetchMetrics(postLinkId).unwrap()
            await refetch()
            ToastComponent({ status: 'success', message: t('postLinksDialog.metricsUpdated') })
        } catch (error: any) {
            await refetch()
            ToastComponent({
                status: 'error',
                message: error?.data?.message || error?.message || t('postLinksDialog.unableToGetMetrics')
            })
        } finally {
            setFetchingIds((prev) => prev.filter((id) => id !== postLinkId))
        }
    }

    const handleFetchFiltered = async () => {
        try {
            const ids = rows.map((row) => row.id)
            const res = await fetchAllMetrics({
                campaign_id: campaignId ?? null,
                post_link_ids: ids.length ? ids : undefined
            }).unwrap()
            if (!res.data.queued) {
                ToastComponent({ status: 'warning', message: t('postLinksMonitor.nothingToQueue') })
                return
            }
            setBatchId(res.data.batch_id)
            ToastComponent({
                status: 'success',
                message: t('postLinksMonitor.batchStarted', { count: res.data.queued })
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('postLinksDialog.unableToGetMetrics')
            })
        }
    }

    const statusLabel = useMemo(
        () =>
            ({
                all: t('postLinksMonitor.statusAll'),
                error: t('postLinksMonitor.statusError'),
                ok: t('postLinksMonitor.statusOk'),
                pending: t('postLinksMonitor.statusPending')
            }) satisfies Record<PostLinksMonitorMetricsStatus, string>,
        [t]
    )

    return (
        <div className="space-y-6">
            <BackdropComponent open={isFetching && !payload} />
            <PageHeader
                title={t('postLinksMonitor.title')}
                description={t('postLinksMonitor.subtitle')}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label={t('postLinksMonitor.statusAll')}
                    value={summary.total}
                    tone="default"
                    active={metricsStatus === 'all'}
                    onClick={() => {
                        setMetricsStatus('all')
                        setPage(1)
                    }}
                    icon={<Link2 className="size-4" />}
                />
                <SummaryCard
                    label={t('postLinksMonitor.statusError')}
                    value={summary.error}
                    tone="destructive"
                    active={metricsStatus === 'error'}
                    onClick={() => {
                        setMetricsStatus('error')
                        setPage(1)
                    }}
                    icon={<AlertCircle className="size-4" />}
                />
                <SummaryCard
                    label={t('postLinksMonitor.statusOk')}
                    value={summary.ok}
                    tone="success"
                    active={metricsStatus === 'ok'}
                    onClick={() => {
                        setMetricsStatus('ok')
                        setPage(1)
                    }}
                    icon={<CheckCircle2 className="size-4" />}
                />
                <SummaryCard
                    label={t('postLinksMonitor.statusPending')}
                    value={summary.pending}
                    tone="muted"
                    active={metricsStatus === 'pending'}
                    onClick={() => {
                        setMetricsStatus('pending')
                        setPage(1)
                    }}
                    icon={<Clock className="size-4" />}
                />
            </div>

            <Card className="border-dashed bg-gradient-to-br from-muted/30 to-background p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="pl-campaign">{t('viewLogs.colCampaign')}</Label>
                            <Select
                                value={campaignId?.toString() ?? 'all'}
                                disabled={campaignsLoading}
                                onValueChange={(value) => {
                                    setCampaignId(value === 'all' ? undefined : Number(value))
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger id="pl-campaign">
                                    <SelectValue placeholder={t('viewLogs.allCampaigns')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('viewLogs.allCampaigns')}</SelectItem>
                                    {campaigns.map((campaign) => (
                                        <SelectItem key={campaign.id} value={String(campaign.id)}>
                                            {campaign.campaign_code ? `${campaign.campaign_code} — ` : ''}
                                            {campaign.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pl-status">{t('postLinksMonitor.filterStatus')}</Label>
                            <Select
                                value={metricsStatus}
                                onValueChange={(value) => {
                                    setMetricsStatus(value as PostLinksMonitorMetricsStatus)
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger id="pl-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabel[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                            <Label htmlFor="pl-search">{t('postLinksMonitor.searchUrl')}</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="pl-search"
                                    value={searchInput}
                                    placeholder={t('postLinksMonitor.searchPlaceholder')}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            applySearch()
                                        }
                                    }}
                                />
                                <Button type="button" variant="secondary" aria-label={t('common:search')} onClick={applySearch}>
                                    <Search className="size-4" />
                                </Button>
                                {searchQ ? (
                                    <Button type="button" variant="outline" onClick={clearSearch}>
                                        {t('postLinksMonitor.clearSearch')}
                                    </Button>
                                ) : null}
                            </div>
                            {searchQ ? (
                                <p className="text-xs text-muted-foreground">
                                    {t('postLinksMonitor.searchActive', { q: searchQ })}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
                            {t('postLinksMonitor.refresh')}
                        </Button>
                        <Button type="button" onClick={handleFetchFiltered} disabled={isBatchRunning || rows.length === 0}>
                            {isBatchRunning ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Sparkles className="size-4" />
                            )}
                            {t('postLinksMonitor.fetchPage')}
                        </Button>
                    </div>
                </div>
            </Card>

            {(isError || (monitorRes && monitorRes.status !== 'success')) && (
                <p role="alert" className="text-sm text-destructive">
                    {t('postLinksMonitor.loadFailed')}
                </p>
            )}

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1100px]">
                        <TableHeader>
                            <TableRow className="bg-muted/60 hover:bg-muted/60">
                                {[
                                    t('viewLogs.colCampaign'),
                                    t('viewLogs.colActor'),
                                    t('viewLogs.colPlatform'),
                                    t('viewLogs.colPostUrl'),
                                    t('metrics.views'),
                                    t('metrics.likes'),
                                    t('postLinksMonitor.colStatus'),
                                    t('common:date'),
                                    ''
                                ].map((h) => (
                                    <TableHead key={h || 'actions'}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => {
                                const fetching = fetchingIds.includes(row.id)
                                const hasError = Boolean(row.metrics_error)
                                const stale = Boolean(row.metrics_error && row.view_log_id)
                                const pending = !hasError && !row.view_log_id
                                const displayUrl = row.canonical_post_url?.trim() || row.post_url
                                return (
                                    <TableRow key={row.id}>
                                        <TableCell className="max-w-[180px]">
                                            {row.campaign ? (
                                                <Link
                                                    to={`/app/campaigns/${row.campaign.uuid}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {row.campaign.campaign_code
                                                        ? `${row.campaign.campaign_code} — `
                                                        : ''}
                                                    {row.campaign.title}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell>{row.influencer?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{row.platform?.name ?? '—'}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[220px]">
                                            <a
                                                href={displayUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex max-w-full items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <ExternalLink className="size-3.5 shrink-0" />
                                                <span className="truncate">{displayUrl}</span>
                                            </a>
                                            {row.canonical_post_url && row.canonical_post_url !== row.post_url ? (
                                                <p className="mt-1 truncate text-xs text-muted-foreground" title={row.post_url}>
                                                    {t('postLinksMonitor.originalShareUrl')}: {row.post_url}
                                                </p>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="tabular-nums">{formatMetric(row.metrics?.views)}</TableCell>
                                        <TableCell className="tabular-nums">{formatMetric(row.metrics?.likes)}</TableCell>
                                        <TableCell className="max-w-[240px]">
                                            {stale ? (
                                                <div className="space-y-1">
                                                    <Badge variant="secondary">{t('postLinksMonitor.staleMetrics')}</Badge>
                                                    {row.metrics?.checked_at ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            {t('postLinksMonitor.snapshotAt', {
                                                                date: formatDateTime(row.metrics.checked_at)
                                                            })}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-xs text-destructive">{row.metrics_error}</p>
                                                </div>
                                            ) : hasError ? (
                                                <Badge
                                                    variant="outline"
                                                    className="whitespace-normal border-destructive/40 bg-destructive/10 text-left font-normal text-destructive"
                                                >
                                                    {row.metrics_error}
                                                </Badge>
                                            ) : pending ? (
                                                <Badge variant="secondary">{t('postLinksMonitor.statusPending')}</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                                                    {t('postLinksMonitor.statusOk')}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.metrics?.checked_at ? formatDateTime(row.metrics.checked_at) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                disabled={fetching || isBatchRunning}
                                                onClick={() => handleFetchOne(row.id)}
                                            >
                                                {fetching ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="size-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {rows.length === 0 && !isFetching && (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                                        {t('common:noDataShort')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <PaginationComponent
                page={page}
                setPage={setPage}
                total={{
                    totalItems: pagination.total,
                    totalPages: pagination.totalPages
                }}
            />
        </div>
    )
}
