import { NumericFormat } from 'react-number-format'
import CampaignViewProgress from './components/CampaignViewProgress'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ArrowUpRight,
    Bookmark,
    CalendarDays,
    Eye,
    Heart,
    LayoutGrid,
    List,
    Loader2,
    MessageCircle,
    Link2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Share2,
    Globe2Icon
} from 'lucide-react'
import { useCreateCampaignMutation, useGetCampaignsMutation, useUpdateCampaignMutation, Campaign } from '../../../stores/services/campaignApi'
import BackdropComponent from '@/components/BackdropComponent'
import { PageHeader } from '@/components/page-header'
import { alertWarning } from '../../../utils/alerts'
import { getMutationPayload, isMutationSuccess } from '../../../utils/mutation-response'
import ToastComponent from '../../../components/ToastComponent'
import { useFetchAllMetricsMutation, useGetMetricsBatchStatusMutation } from '../../../stores/services/viewLogApi'
import PaginationComponent, { ResPagination } from '../../../components/PaginationComponent'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { formatDate } from '@/utils/datetime'
import { useSelector } from 'react-redux'
import { RootState } from '../../../stores'
import { useGetCustomersQuery } from '../../../stores/services/customerApi'
import { INTERNAL_ROLES, normalizeRole } from '../../../config/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'
import { PostLinksDialog } from './PostLinksDialog'

const formatMetric = (value: number | string | null | undefined) => Number(value || 0).toLocaleString()

const metricItems = [
    { key: 'total_view', labelKey: 'metrics.views' as const, icon: Eye, className: 'text-sky-600 bg-sky-500/10' },
    { key: 'total_like', labelKey: 'metrics.likes' as const, icon: Heart, className: 'text-rose-600 bg-rose-500/10' },
    { key: 'total_comment', labelKey: 'metrics.comments' as const, icon: MessageCircle, className: 'text-violet-600 bg-violet-500/10' },
    { key: 'total_share', labelKey: 'metrics.shares' as const, icon: Share2, className: 'text-emerald-600 bg-emerald-500/10' },
    { key: 'total_save', labelKey: 'metrics.saves' as const, icon: Bookmark, className: 'text-amber-600 bg-amber-500/10' }
] as const

const CampaignMetrics = ({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) => {
    const { t } = useTranslation('app')
    return (
        <div className={compact ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'grid min-w-[310px] grid-cols-2 gap-1.5 sm:grid-cols-3'}>
            {metricItems.map(({ key, labelKey, icon: Icon, className }) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-2 py-1.5">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${className}`}>
                        <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-[10px] leading-none text-muted-foreground">{t(labelKey)}</span>
                        <span className="mt-1 block text-xs font-semibold tabular-nums">{formatMetric(campaign[key])}</span>
                    </span>
                </div>
            ))}
        </div>
    )
}

const CampaignsPage: React.FC = () => {
    const { t } = useTranslation('app')
    const emptyForm = {
        customer_ids: [] as number[],
        title: '',
        target_views: '',
        description: '',
        start_date: '',
        end_date: ''
    }

    const auth = useSelector((state: RootState) => state.auth)
    const canManage = INTERNAL_ROLES.includes(normalizeRole(auth.role) as any)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
    const [page, setPage] = useState(1)
    const [keyword, setKeyword] = useState('')
    const [rows, setRows] = useState<Campaign[]>([])
    const [total, setTotal] = useState<ResPagination>({ totalItems: 0, totalPages: 0 })
    const [open, setOpen] = useState(false)
    const [linksCampaign, setLinksCampaign] = useState<Campaign | null>(null)
    const [editId, setEditId] = useState<number | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [batchId, setBatchId] = useState<string | null>(null)
    const [batchCampaignId, setBatchCampaignId] = useState<number | null>(null)
    const [batchProgress, setBatchProgress] = useState<{
        total: number
        finished: number
        failed: number
    } | null>(null)

    const { data: customersRes } = useGetCustomersQuery({ page: 1, limit: 100 }, { skip: !open || !canManage })
    const allCustomers = customersRes?.data ?? []
    const customerOptions = useMemo(
        () =>
            allCustomers.map((customer: any) => ({
                value: customer.id as number,
                label: customer.full_name || customer.company_name || customer.customer_code,
                description: [customer.customer_code, customer.company_email || customer.email].filter(Boolean).join(' · ')
            })),
        [allCustomers]
    )

    const [fetchCampaigns, { isLoading }] = useGetCampaignsMutation()
    const [createCampaign, { isLoading: creating }] = useCreateCampaignMutation()
    const [updateCampaign, { isLoading: updating }] = useUpdateCampaignMutation()
    const [fetchAllMetrics, { isLoading: queueingMetrics }] = useFetchAllMetricsMutation()
    const [getBatchStatus] = useGetMetricsBatchStatusMutation()

    const refetch = async () => {
        const res = await fetchCampaigns({ page, keyword: keyword || null })
        if ('data' in res && res.data?.status === 'success') {
            setRows(res.data.data)
            setTotal(res.data.pagination)
        }
    }

    useEffect(() => {
        refetch()
    }, [page])

    useEffect(() => {
        if (!batchId) return

        let cancelled = false
        let checking = false
        const checkStatus = async () => {
            if (checking) return
            checking = true
            try {
                const response = await getBatchStatus(batchId).unwrap()
                if (cancelled) return
                const status = response.data
                setBatchProgress({
                    total: status.total,
                    finished: status.finished,
                    failed: status.failed
                })
                if (status.done) {
                    setBatchId(null)
                    setBatchCampaignId(null)
                    setBatchProgress(null)
                    await refetch()
                    ToastComponent({
                        status: status.failed > 0 ? 'warning' : 'success',
                        message:
                            status.failed > 0
                                ? t('campaigns.metricsPartial', { completed: status.completed, total: status.total, failed: status.failed })
                                : t('campaigns.metricsSuccess', { completed: status.completed })
                    })
                }
            } catch {
                // Keep polling; a temporary status request failure must not stop background jobs.
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
    }, [batchId, getBatchStatus])

    const openCreate = () => {
        setEditId(null)
        setForm({ ...emptyForm })
        setOpen(true)
    }

    const openEdit = (c: Campaign) => {
        const linkedIds = c.campaign_customers?.map((item) => item.customers?.id ?? item.customer_id).filter(Boolean) ?? []
        setEditId(c.id)
        setForm({
            customer_ids: linkedIds.length ? (linkedIds as number[]) : c.customer_id ? [c.customer_id] : c.customers?.id ? [c.customers.id] : [],
            title: c.title,
            target_views: c.target_views?.toString() ?? '',
            description: c.description ?? '',
            start_date: c.start_date ? c.start_date.slice(0, 10) : '',
            end_date: c.end_date ? c.end_date.slice(0, 10) : ''
        })
        setOpen(true)
    }

    const handleClose = () => setOpen(false)

    const handleSubmit = async () => {
        if (!form.title.trim()) return alertWarning({ text: t('campaigns.enterTitle') })

        if (form.target_views && (!Number.isInteger(Number(form.target_views)) || Number(form.target_views) < 1 || Number(form.target_views) > 2147483647)) return alertWarning({ text: t('campaigns.targetViewsInvalid') })
        const body = {
            customer_ids: form.customer_ids,
            title: form.title.trim(),
            target_views: form.target_views ? Number(form.target_views) : null,
            description: form.description?.trim() || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null
        }

        const response = editId ? await updateCampaign({ id: editId, ...body }) : await createCampaign(body as any)

        const data = getMutationPayload(response)
        if (data) ToastComponent(data)
        if (!isMutationSuccess(data)) return

        handleClose()
        refetch()
    }

    const handleFetchMetrics = async (campaign_id: number) => {
        try {
            const res = await fetchAllMetrics({ campaign_id }).unwrap()
            if (res.data.queued === 0) {
                ToastComponent({
                    status: 'warning',
                    message: t('campaigns.noPostLinks')
                })
                return
            }
            setBatchProgress({
                total: res.data.queued,
                finished: 0,
                failed: 0
            })
            setBatchCampaignId(campaign_id)
            setBatchId(res.data.batch_id)
            ToastComponent({
                status: 'success',
                message: t('campaigns.fetchStarted', { queued: res.data.queued })
            })
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('campaigns.fetchError')
            })
        }
    }

    const isActive = (c: Campaign) => {
        const now = dayjs()
        const start = c.start_date ? dayjs(c.start_date) : null
        const end = c.end_date ? dayjs(c.end_date) : null
        if (!start && !end) return true
        if (start && now.isBefore(start)) return false
        if (end && now.isAfter(end)) return false
        return true
    }

    const tableBusy = isLoading || creating || updating || queueingMetrics

    return (
        <div className="space-y-5">
            <BackdropComponent open={tableBusy} />
            <PageHeader
                title={t('campaigns.title')}
                description={t('campaigns.description')}
                actions={
                    canManage ? (
                        <Button onClick={openCreate} className="shadow-sm">
                            <Plus className="size-4" />
                            {t('common:addNew')}
                        </Button>
                    ) : undefined
                }
                className="mb-0"
            />

            <Card className="overflow-hidden border-border/70 shadow-sm">
                <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        className="flex w-full gap-2 sm:max-w-md"
                        onSubmit={(event) => {
                            event.preventDefault()
                            setPage(1)
                            void refetch()
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('campaigns.searchPlaceholder')}
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                className="bg-background pl-9 h-9 text-xs sm:text-sm"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            {t('common:search')}
                        </Button>
                    </form>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        {batchId && batchProgress ? (
                            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                                <Loader2 className="size-3.5 animate-spin" />
                                {t('campaigns.fetching', { finished: batchProgress.finished, total: batchProgress.total })}
                                {batchProgress.failed > 0 ? ` · ${t('campaigns.failedCount', { count: batchProgress.failed })}` : ''}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {t('campaigns.showing', { shown: rows.length, total: total.totalItems.toLocaleString() })}
                            </p>
                        )}

                        {/* View Switcher */}
                        <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border">
                            <Button
                                type="button"
                                size="sm"
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                className={`h-7 px-2.5 text-xs gap-1.5 font-semibold ${viewMode === 'grid' ? 'shadow-2xs' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="size-3.5" />
                                {t('campaigns.grid')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                className={`h-7 px-2.5 text-xs gap-1.5 font-semibold ${viewMode === 'table' ? 'shadow-2xs' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <List className="size-3.5" />
                                {t('campaigns.table')}
                            </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="p-4">
                        {rows.length === 0 && !isLoading ? (
                            <div className="py-16 text-center text-muted-foreground">
                                <p className="text-sm">{t('campaigns.empty')}</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                                {rows.map((row) => {
                                    const active = isActive(row)
                                    return (
                                        <Card
                                            key={row.id}
                                            className="group relative overflow-hidden transition-all duration-200 border-border/70 hover:border-primary/40 hover:shadow-md flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Top gradient accent line */}
                                                <div
                                                    className={`h-1.5 w-full ${active ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-muted-foreground/30'
                                                        }`}
                                                />

                                                <div className="p-4 pb-3 space-y-3">
                                                    {/* Header: Code / Customer & Status Badge */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            {row.campaign_code && (
                                                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                                                    {row.campaign_code}
                                                                </span>
                                                            )}
                                                            {row.customers?.company_name && (
                                                                <p className="text-xs font-semibold text-primary mt-1 truncate">{row.customers.company_name}</p>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant={active ? 'default' : 'secondary'}
                                                            className={
                                                                active
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold'
                                                                    : 'text-[10px] font-bold'
                                                            }
                                                        >
                                                            {active ? t('status.active') : t('status.ended')}
                                                        </Badge>
                                                    </div>

                                                    {/* Title & Description */}
                                                    <div>
                                                        <Link
                                                            to={`/app/campaigns/${row.uuid}`}
                                                            className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                                                        >
                                                            <span className="truncate">{row.title}</span>
                                                            <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                                                        </Link>
                                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground min-h-[32px]">
                                                            {row.description || t('campaigns.noDescription')}
                                                        </p>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="rounded-xl bg-muted/40 p-2.5 border border-border/60">
                                                        <CampaignMetrics campaign={row} compact />
                                                        <CampaignViewProgress actual={row.total_view} target={row.target_views} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer: Timeline & Actions */}
                                            <div className="border-t bg-muted/10 p-3 px-4 flex items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                                                    <CalendarDays className="size-3.5 shrink-0 text-primary" />
                                                    <span>{formatDate(row.start_date)}</span>
                                                    <span>–</span>
                                                    <span>{formatDate(row.end_date)}</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {canManage && (
                                                        <>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7"
                                                                            onClick={() => setLinksCampaign(row)}
                                                                        >
                                                                            <Link2 className="size-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('campaigns.postLinksTooltip')}</TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="size-7"
                                                                            disabled={Boolean(batchId) || queueingMetrics}
                                                                            onClick={() => handleFetchMetrics(row.id)}
                                                                        >
                                                                            {batchCampaignId === row.id && batchId ? (
                                                                                <Loader2 className="size-3.5 animate-spin text-primary" />
                                                                            ) : (
                                                                                <Globe2Icon className="size-3.5" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('campaigns.fetchMetrics')}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7"
                                                                onClick={() => openEdit(row)}
                                                                title={t('campaigns.editCampaign')}
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button size="sm" variant="secondary" className="h-7 px-2.5 text-xs font-semibold gap-1" asChild>
                                                        <Link to={`/app/campaigns/${row.uuid}`}>
                                                            {t('campaigns.detail')} <ArrowUpRight className="size-3" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Table View */
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="w-[42px]">#</TableHead>
                                        <TableHead>{t('dashboard.colCampaign')}</TableHead>
                                        <TableHead>{t('campaigns.fetchMetrics')}</TableHead>
                                        <TableHead>{t('campaigns.timeline')}</TableHead>
                                        <TableHead>{t('common:status')}</TableHead>
                                        <TableHead className="text-right">{t('common:actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row, i) => (
                                        <TableRow key={row.id} className="group">
                                            <TableCell className="text-muted-foreground text-xs">{(page - 1) * 25 + i + 1}</TableCell>
                                            <TableCell className="max-w-[280px]">
                                                <div className="space-y-0.5">
                                                    {row.campaign_code && (
                                                        <span className="text-[10px] font-mono text-muted-foreground mr-1.5">{row.campaign_code}</span>
                                                    )}
                                                    <Link
                                                        to={`/app/campaigns/${row.uuid}`}
                                                        className="font-semibold text-foreground transition-colors hover:text-primary"
                                                    >
                                                        {row.title}
                                                    </Link>
                                                    <p className="line-clamp-1 text-xs text-muted-foreground">{row.description || t('campaigns.noDescriptionShort')}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <CampaignMetrics campaign={row} />
                                                <CampaignViewProgress actual={row.total_view} target={row.target_views} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-[125px] space-y-0.5 text-xs text-muted-foreground">
                                                    <p>{formatDate(row.start_date)} {t('campaigns.dateTo')}</p>
                                                    <p>{formatDate(row.end_date)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={isActive(row) ? 'default' : 'secondary'}
                                                    className={
                                                        isActive(row)
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold'
                                                            : 'text-[10px] font-bold'
                                                    }
                                                >
                                                    {isActive(row) ? t('status.active') : t('status.ended')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TooltipProvider>
                                                    <div className="inline-flex items-center gap-1 justify-end">
                                                        {canManage && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setLinksCampaign(row)}>
                                                                        <Link2 className="size-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('campaigns.postLinksTooltip')}</TooltipContent>
                                                            </Tooltip>
                                                        )}

                                                        {canManage && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-7"
                                                                        disabled={Boolean(batchId) || queueingMetrics}
                                                                        onClick={() => handleFetchMetrics(row.id)}
                                                                    >
                                                                        {batchCampaignId === row.id && batchId ? (
                                                                            <Loader2 className="size-3.5 animate-spin" />
                                                                        ) : (
                                                                            <RefreshCw className="size-3.5" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('campaigns.fetchAllMetrics')}</TooltipContent>
                                                            </Tooltip>
                                                        )}

                                                        {canManage && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(row)}>
                                                                        <Pencil className="size-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('common:edit')}</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-7" asChild>
                                                                    <Link to={`/app/campaigns/${row.uuid}`}>
                                                                        <ArrowUpRight className="size-3.5" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('campaigns.viewDetails')}</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {rows.length === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                                {t('common:noDataShort')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </CardContent>
                )}
            </Card>
            <PaginationComponent page={page} setPage={setPage} total={total} className="mt-0" />

            <PostLinksDialog campaign={linksCampaign} open={Boolean(linksCampaign)} onOpenChange={(next) => !next && setLinksCampaign(null)} />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editId ? t('campaigns.editCampaign') : t('campaigns.addCampaign')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('campaigns.customersAccess')}</Label>
                            <MultiSelectCombobox
                                options={customerOptions}
                                selected={form.customer_ids}
                                onChange={(customer_ids) => setForm({ ...form, customer_ids })}
                                placeholder={t('campaigns.selectCustomers')}
                                searchPlaceholder={t('campaigns.searchCustomerFields')}
                                emptyText={t('campaigns.noCustomerFound')}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="campaign_title">{t('campaigns.titleRequired')}</Label>
                            <Input id="campaign_title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="campaign_target_views">{t('campaigns.targetViews')}</Label>
                            <NumericFormat
                                id="campaign_target_views"
                                customInput={Input}
                                value={form.target_views}
                                valueIsNumericString
                                thousandSeparator=","
                                decimalScale={0}
                                allowNegative={false}
                                inputMode="numeric"
                                isAllowed={({ floatValue }) => floatValue == null || floatValue <= 2147483647}
                                onValueChange={({ value }) => setForm(prev => ({ ...prev, target_views: value }))}
                                placeholder={t('campaigns.targetViewsHint')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="campaign_description">{t('campaigns.descriptionLabel')}</Label>
                            <Textarea
                                id="campaign_description"
                                rows={8}
                                value={form.description}
                                placeholder={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">{t('campaigns.startDate')}</Label>
                                <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">{t('campaigns.endDate')}</Label>
                                <Input id="end_date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            {t('common:cancel')}
                        </Button>
                        <Button onClick={handleSubmit} disabled={creating || updating}>
                            {t('common:save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CampaignsPage
