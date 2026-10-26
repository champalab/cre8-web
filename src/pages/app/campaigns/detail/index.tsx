import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink, Globe2Icon, Loader2, Megaphone, Trash2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BackdropComponent from '../../../../components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import { canAccess, INTERNAL_ROLES } from '@/config/roles'
import { RootState } from '@/stores'
import { confirmDelete } from '@/utils/alerts'
import {
    Campaign,
    useGetCampaignDetailByUuidQuery,
    useGetCampaignsListQuery,
    useDeleteCampaignMutation
} from '../../../../stores/services/campaignApi'
import { useFetchAllMetricsMutation, useGetMetricsBatchStatusMutation } from '@/stores/services/viewLogApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from './tabs/OverviewTab'
import CustomersTab from './tabs/CustomersTab'
import InfluencerTab from './tabs/InfluencerTab'
import StatusTab from './tabs/StatusTab'
import CampaignSelector from '../components/CampaignSelector'
import { fetchCampaignPerformance, CampaignPerformanceData } from '@/pages/public/campaigns/campaign.api'
import { CampaignBanner } from '@/pages/public/campaigns/components/CampaignBanner'
import { toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'

const TAB_KEYS = ['overview', 'status', 'influencer', 'customers'] as const

const CampaignDetailPage: React.FC = () => {
    const { t } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canGetMetrics = canAccess(auth.role, INTERNAL_ROLES)
    const { uuid: routeUuid = '' } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()

    const rawTab = (searchParams.get('tab') as (typeof TAB_KEYS)[number]) || 'overview'
    const initialTab = TAB_KEYS.indexOf(rawTab)
    const [tab, setTab] = useState(initialTab >= 0 ? TAB_KEYS[initialTab] : 'overview')

    // Fetch campaigns list for switcher
    const { data: listRes, isLoading: isLoadingList, isFetching: isFetchingList } = useGetCampaignsListQuery({ limit: 100 })
    const campaigns = listRes?.data || []

    const queryUuid = searchParams.get('uuid') || ''
    const fallbackUuid = campaigns.length > 0 ? campaigns[0]?.uuid || '' : ''
    const effectiveUuid = routeUuid || queryUuid || fallbackUuid

    // Synchronize query param if navigated without UUID (e.g. from sidebar /app/campaign-reports)
    useEffect(() => {
        if (!routeUuid && !searchParams.get('uuid') && fallbackUuid) {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('uuid', fallbackUuid)
                    return next
                },
                { replace: true }
            )
        }
    }, [routeUuid, searchParams, fallbackUuid, setSearchParams])

    const { data, isLoading, isFetching, refetch } = useGetCampaignDetailByUuidQuery(
        { uuid: effectiveUuid },
        { skip: !effectiveUuid }
    )
    const campaign = data?.data

    // Public performance data matching the public campaigns page
    const [performanceData, setPerformanceData] = useState<CampaignPerformanceData | null>(null)
    const [isLoadingPerformance, setIsLoadingPerformance] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const loadPerformanceData = useCallback(async () => {
        if (!effectiveUuid) return
        setIsLoadingPerformance(true)
        try {
            const res = await fetchCampaignPerformance(effectiveUuid)
            if (res) {
                setPerformanceData(res)
            }
        } catch (err) {
            console.error('Failed to load performance metrics', err)
        } finally {
            setIsLoadingPerformance(false)
        }
    }, [effectiveUuid])

    useEffect(() => {
        loadPerformanceData()
    }, [loadPerformanceData])

    // Derive complete performance data fallback if public payload is pending
    const effectivePerformanceData: CampaignPerformanceData = performanceData || {
        uuid: campaign?.uuid || effectiveUuid || '',
        title: campaign?.title || '',
        description: campaign?.description || null,
        total_views: campaign?.total_view || campaign?.overview?.totals?.views_count || 0,
        views_by_platform:
            campaign?.overview?.platforms?.map((p) => ({
                platform_name: p.name,
                count: p.views || 0
            })) || [],
        campaign_influencers: []
    }

    const [fetchAllMetrics, { isLoading: isQueueing }] = useFetchAllMetricsMutation()
    const [getBatchStatus] = useGetMetricsBatchStatusMutation()
    const [deleteCampaign, { isLoading: isDeleting }] = useDeleteCampaignMutation()
    const [batchId, setBatchId] = useState<string | null>(null)
    const isBatchRunning = isQueueing || Boolean(batchId)

    const handleDeleteCampaign = async () => {
        if (!campaign) return
        const confirmation = await confirmDelete({
            title: t('campaignDetail.deleteTitle', 'Delete Campaign?'),
            text: t('campaignDetail.deleteText', { name: campaign.title }),
            confirmButtonText: t('common:delete', 'Delete'),
            cancelButtonText: t('common:cancel', 'Cancel')
        })
        if (!confirmation.isConfirmed) return

        try {
            const res = await deleteCampaign(campaign.id).unwrap()
            ToastComponent({
                status: 'success',
                message: res.message || t('campaigns.deleteSuccess', 'Campaign deleted successfully')
            })
            navigate('/app/campaigns')
        } catch (error: any) {
            ToastComponent({
                status: 'error',
                message: error?.data?.message || t('common:errorOccurred', 'An error occurred')
            })
        }
    }

    useEffect(() => {
        const nextRaw = (searchParams.get('tab') as (typeof TAB_KEYS)[number]) || 'overview'
        const nextTab = TAB_KEYS.indexOf(nextRaw)
        if (nextTab >= 0) setTab(TAB_KEYS[nextTab])
    }, [searchParams])

    const handleTabChange = (value: string) => {
        setTab(value as (typeof TAB_KEYS)[number])
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                next.set('tab', value)
                return next
            },
            { replace: true }
        )
    }

    const handleSelectCampaign = (selected: Campaign) => {
        if (!selected.uuid) return
        if (location.pathname.startsWith('/app/campaigns/') && location.pathname !== '/app/campaigns') {
            navigate(`/app/campaigns/${selected.uuid}?tab=${tab}`)
        } else {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('uuid', selected.uuid!)
                    next.set('tab', tab)
                    return next
                },
                { replace: false }
            )
        }
    }

    const reloadCampaign = async () => {
        await Promise.all([refetch(), loadPerformanceData()])
    }

    const publicUrl = campaign?.uuid ? `${window.location.origin}/campaigns/${campaign.uuid}` : ''

    const handleOpen = () => {
        if (!publicUrl) return
        window.open(publicUrl, '_blank', 'noopener,noreferrer')
    }

    const handleGetCampaignMetrics = async () => {
        if (!campaign) return
        try {
            const response = await fetchAllMetrics({ campaign_id: campaign.id }).unwrap()
            if (!response.data.queued) {
                return ToastComponent({ status: 'warning', message: t('statusTab.noSupportedLinksCampaign') })
            }
            setBatchId(response.data.batch_id)
            ToastComponent({ status: 'success', message: t('statusTab.startedGettingMetrics', { queued: response.data.queued }) })
        } catch (error: any) {
            ToastComponent({ status: 'error', message: error?.data?.message || t('statusTab.unableToGetMetrics') })
        }
    }

    // Refresh everything (metrics sync + backend query refetch)
    const handleRefreshAll = async () => {
        if (canGetMetrics && campaign) {
            await handleGetCampaignMetrics()
        }
        await reloadCampaign()
    }

    // PDF Export matching public campaigns implementation
    const handleExportPDF = async () => {
        const element = document.getElementById('campaign-report-content')
        if (!element) return
        setIsExporting(true)
        await new Promise((resolve) => setTimeout(resolve, 300))

        try {
            const canvas = await toCanvas(element, {
                cacheBust: true,
                pixelRatio: 2,
                filter: (node) => {
                    if (node.nodeType === 1) {
                        const el = node as HTMLElement
                        if (el.getAttribute('data-html2canvas-ignore') === 'true') {
                            return false
                        }
                    }
                    return true
                }
            })

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const pxToMm = pdfWidth / canvas.width
            const mmToPx = canvas.width / pdfWidth
            const pagePxHeight = pdfHeight * mmToPx

            const elements = Array.from(element.querySelectorAll('.pdf-avoid-break'))
            const parentRect = element.getBoundingClientRect()
            const breakPoints = elements.map((el) => {
                const rect = el.getBoundingClientRect()
                return {
                    top: (rect.top - parentRect.top) * 2,
                    bottom: (rect.bottom - parentRect.top) * 2
                }
            })

            let currentY = 0
            let pageNum = 0

            while (currentY < canvas.height) {
                let targetBottom = currentY + pagePxHeight

                if (targetBottom >= canvas.height) {
                    targetBottom = canvas.height
                } else {
                    for (const bp of breakPoints) {
                        if (bp.top < targetBottom && bp.bottom > targetBottom) {
                            if (bp.top > currentY) {
                                targetBottom = bp.top
                            }
                            break
                        }
                    }
                }

                const sliceHeight = targetBottom - currentY
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = canvas.width
                tempCanvas.height = sliceHeight
                const tempCtx = tempCanvas.getContext('2d')
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
                    const imgData = tempCanvas.toDataURL('image/jpeg', 0.95)

                    if (pageNum > 0) {
                        pdf.addPage()
                    }
                    const mmSliceHeight = sliceHeight * pxToMm
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, mmSliceHeight)
                }

                currentY = targetBottom
                pageNum++
            }

            pdf.save(`campaign-report-${campaign?.campaign_code || campaign?.uuid || 'export'}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF', error)
        } finally {
            setIsExporting(false)
        }
    }

    useEffect(() => {
        if (!batchId) return
        let cancelled = false
        const checkStatus = async () => {
            try {
                const response = await getBatchStatus(batchId).unwrap()
                if (cancelled) return
                const status = response.data
                if (status.done) {
                    setBatchId(null)
                    await reloadCampaign()
                    ToastComponent({
                        status: status.failed ? 'warning' : 'success',
                        message: status.failed
                            ? t('campaignDetail.metricsPartial', {
                                  completed: status.completed,
                                  total: status.total,
                                  failed: status.failed
                              })
                            : t('campaignDetail.metricsSuccess', { completed: status.completed })
                    })
                }
            } catch {
                // Retry temporary polling failures.
            }
        }
        void checkStatus()
        const interval = window.setInterval(checkStatus, 2500)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [batchId, getBatchStatus, t])

    const isGlobalLoading = (isLoading || isFetching || isLoadingList) && !campaign

    if (isGlobalLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <BackdropComponent open={true} />
            </div>
        )
    }

    if (!effectiveUuid && campaigns.length === 0 && !isLoadingList) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                    <Megaphone className="size-7" />
                </div>
                <p className="text-lg font-bold font-lao">{t('campaignDetail.noCampaignsAvailable', 'No campaigns available')}</p>
                <p className="mb-5 mt-1 max-w-sm text-sm text-muted-foreground font-lao">
                    {t('campaignDetail.noCampaignsHint', 'There are no campaigns created yet or you have not been granted access.')}
                </p>
                <Button onClick={() => navigate('/app/campaigns')} className="gap-2 rounded-xl">
                    <ArrowLeft className="size-4" /> {t('campaignDetail.backToList', 'Back to Campaign List')}
                </Button>
            </div>
        )
    }

    if (effectiveUuid && !isLoading && !isFetching && !campaign) {
        return (
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/app/campaigns')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <CampaignSelector
                        selectedUuid={effectiveUuid}
                        campaigns={campaigns}
                        isLoading={isLoadingList || isFetchingList}
                        onSelect={handleSelectCampaign}
                    />
                </div>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-lg font-bold font-lao">{t('campaignDetail.notFound')}</p>
                    <p className="mb-4 mt-1 text-sm text-muted-foreground font-lao">{t('campaignDetail.notFoundHint')}</p>
                    <Button onClick={() => navigate('/app/campaigns')} className="gap-2 rounded-xl">
                        <ArrowLeft className="size-4" /> {t('campaignDetail.backToList')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            id="campaign-report-content"
            className={`min-h-screen text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500/30 ${
                isExporting ? 'pdf-export-mode' : ''
            }`}
        >
            <BackdropComponent open={isLoading || isFetching || isDeleting} />

            {/* Top Control Bar: Back button, Campaign Selector, Public Link, Delete */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6" data-html2canvas-ignore="true">
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
                        onClick={() => navigate('/app/campaigns')}
                        title={t('campaignDetail.backToList')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <CampaignSelector
                        selectedUuid={effectiveUuid}
                        campaigns={campaigns}
                        isLoading={isLoadingList || isFetchingList}
                        onSelect={handleSelectCampaign}
                    />
                </div>

                {campaign && (
                    <div className="flex flex-wrap items-center gap-2">
                        {canGetMetrics && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 font-lao"
                                onClick={handleGetCampaignMetrics}
                                disabled={isBatchRunning}
                            >
                                {isBatchRunning ? <Loader2 className="size-4 animate-spin text-indigo-600" /> : <Globe2Icon className="size-4" />}
                                <span>{t('campaignDetail.refreshMetrics')}</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpen}
                            className="gap-1.5 h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 font-lao"
                            title="Open Public Link"
                        >
                            <ExternalLink className="size-4" />
                            <span>Open Public</span>
                        </Button>
                        {canGetMetrics && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteCampaign}
                                disabled={isDeleting}
                                className="gap-1.5 h-10 px-3.5 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive hover:text-destructive font-lao"
                            >
                                <Trash2 className="size-4" />
                                <span>{t('campaignDetail.deleteCampaign', 'Delete Campaign')}</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Hero Campaign Banner matching Public Campaigns */}
            {campaign && (
                <div className="pdf-avoid-break">
                    <CampaignBanner
                        campaign={effectivePerformanceData}
                        loading={isLoadingPerformance || isBatchRunning}
                        onRefresh={handleRefreshAll}
                        onExportPDF={handleExportPDF}
                        isExporting={isExporting}
                        status={campaign.status}
                    />
                </div>
            )}

            {/* Navigation Tabs Bar */}
            {campaign && (
                <Tabs value={tab} onValueChange={handleTabChange} className="w-full min-w-0">
                    <div
                        className="-mx-1 snap-x overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        data-html2canvas-ignore="true"
                    >
                        <TabsList className="h-12 w-max min-w-full justify-start p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm gap-1">
                            <TabsTrigger
                                className="snap-start rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-lao"
                                value="overview"
                            >
                                📊 {t('campaignDetail.overview')}
                            </TabsTrigger>
                            <TabsTrigger
                                className="snap-start rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-lao"
                                value="status"
                            >
                                🔗 {t('campaignDetail.status')} ({campaign.post_link_summary?.total ?? 0})
                            </TabsTrigger>
                            <TabsTrigger
                                className="snap-start rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-lao"
                                value="influencer"
                            >
                                👥 {t('campaignDetail.influencer')} ({campaign.post_link_summary?.influencers ?? 0})
                            </TabsTrigger>
                            <TabsTrigger
                                className="snap-start rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-lao"
                                value="customers"
                            >
                                🏢 {t('campaignDetail.customers')}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="w-full min-w-0 mt-6">
                        <OverviewTab
                            campaign={campaign}
                            performanceData={effectivePerformanceData}
                            isLoadingPerformance={isLoadingPerformance}
                        />
                    </TabsContent>
                    <TabsContent value="status" className="w-full min-w-0 mt-6">
                        <StatusTab campaign={campaign} onChanged={reloadCampaign} />
                    </TabsContent>
                    <TabsContent value="influencer" className="w-full min-w-0 mt-6">
                        <InfluencerTab campaign={campaign} onChanged={reloadCampaign} />
                    </TabsContent>
                    <TabsContent value="customers" className="w-full min-w-0 mt-6">
                        <CustomersTab campaign={campaign} onChanged={reloadCampaign} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

export default CampaignDetailPage
