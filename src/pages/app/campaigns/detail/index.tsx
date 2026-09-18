import CampaignViewProgress from '../components/CampaignViewProgress'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Copy, ExternalLink, Globe2Icon, Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import BackdropComponent from '../../../../components/BackdropComponent'
import ToastComponent from '@/components/ToastComponent'
import { canAccess, INTERNAL_ROLES } from '@/config/roles'
import { RootState } from '@/stores'
import { useGetCampaignDetailByUuidQuery } from '../../../../stores/services/campaignApi'
import { useFetchAllMetricsMutation, useGetMetricsBatchStatusMutation } from '@/stores/services/viewLogApi'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from './tabs/OverviewTab'
import CustomersTab from './tabs/CustomersTab'
import InfluencerTab from './tabs/InfluencerTab'
import StatusTab from './tabs/StatusTab'

const TAB_KEYS = ['overview', 'status', 'influencer', 'customers'] as const

const CampaignDetailPage: React.FC = () => {
    const { t } = useTranslation('app')
    const auth = useSelector((state: RootState) => state.auth)
    const canGetMetrics = canAccess(auth.role, INTERNAL_ROLES)
    const { uuid = '' } = useParams()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const rawTab = (searchParams.get('tab') as (typeof TAB_KEYS)[number]) || 'overview'
    const initialTab = TAB_KEYS.indexOf(rawTab)
    const [tab, setTab] = useState(initialTab >= 0 ? TAB_KEYS[initialTab] : 'overview')

    const { data, isLoading, isFetching, refetch } = useGetCampaignDetailByUuidQuery({ uuid }, { skip: !uuid })
    const campaign = data?.data
    const [fetchAllMetrics, { isLoading: isQueueing }] = useFetchAllMetricsMutation()
    const [getBatchStatus] = useGetMetricsBatchStatusMutation()
    const [batchId, setBatchId] = useState<string | null>(null)
    const isBatchRunning = isQueueing || Boolean(batchId)

    useEffect(() => {
        const nextRaw = (searchParams.get('tab') as (typeof TAB_KEYS)[number]) || 'overview'
        const nextTab = TAB_KEYS.indexOf(nextRaw)
        if (nextTab >= 0) setTab(TAB_KEYS[nextTab])
    }, [searchParams])

    const handleTabChange = (value: string) => {
        setTab(value as (typeof TAB_KEYS)[number])
        setSearchParams({ tab: value }, { replace: true })
    }

    const reloadCampaign = async () => {
        await refetch()
    }

    const publicUrl = campaign ? `${window.location.origin}/campaigns/${campaign.uuid}` : ''

    const handleCopy = () => {
        if (!publicUrl) return
        navigator.clipboard.writeText(publicUrl)
        toast.success(t('campaignDetail.linkCopied', 'Link copied to clipboard!'))
    }

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
                    await refetch()
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
    }, [batchId, getBatchStatus, refetch, t])

    if (!uuid || (!isLoading && !isFetching && !campaign)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <BackdropComponent open={isLoading || isFetching} />
                <p className="text-lg font-bold">{t('campaignDetail.notFound')}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{t('campaignDetail.notFoundHint')}</p>
                <Button onClick={() => navigate('/app/campaigns')} className="gap-2">
                    <ArrowLeft className="size-4" /> {t('campaignDetail.backToList')}
                </Button>
            </div>
        )
    }

    return (
        <div>
            <BackdropComponent open={isLoading || isFetching} />

            <div className="mb-4 flex flex-wrap items-start justify-between gap-4 sm:items-center">
                <div className="flex items-start gap-1.5 sm:items-center sm:gap-2">
                    <Button variant="ghost" size="icon" className="mt-0.5 shrink-0 sm:mt-0" onClick={() => navigate('/app/campaigns')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="break-words text-xl font-bold sm:text-2xl">{campaign?.title || t('campaignDetail.fallbackTitle')}</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">{t('campaignDetail.hubSubtitle')}</p>
                    </div>
                </div>

                {campaign && (
                    <div className="flex flex-wrap items-center gap-2">
                        {canGetMetrics && (
                            <Button size="sm" className="gap-1.5" onClick={handleGetCampaignMetrics} disabled={isBatchRunning}>
                                {isBatchRunning ? <Loader2 className="size-4 animate-spin" /> : <Globe2Icon className="size-4" />}
                                {t('campaignDetail.refreshMetrics')}
                            </Button>
                        )}
                        <button
                            onClick={() => {
                                const url = 'www.cre8.la' //window.location.href
                                const title = campaign.title || t('publicCampaign.title')
                                const formattedViews = new Intl.NumberFormat('en-US').format(campaign.total_view || 0)
                                const text = `- ລາຍງານຍອດວິວແຄມເປນ: ${title ?? '-'}\n- ຍອດວິວລວມ: ${formattedViews} ວິວ\n\nກົດເບິ່ງລາຍລະອຽດລາຍງານຜົນງານແຄມເປນໄດ້ທີ່ລິ້ງນີ້:\n${url}`
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                            }}
                            data-html2canvas-ignore="true"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all text-sm font-semibold shadow-md shadow-[#25D366]/20 font-lao"
                        >
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            Share to Whatsapp {campaign.description}
                        </button>
                        <Button variant="outline" size="sm" onClick={handleOpen} className="gap-1.5">
                            <ExternalLink className="size-4" />
                            Open
                        </Button>
                    </div>
                )}
            </div>

            {campaign && tab !== 'overview' && <CampaignViewProgress actual={campaign.total_view} target={campaign.target_views} />}

            <Tabs value={tab} onValueChange={handleTabChange} className="w-full min-w-0">
                <div className="-mx-1 snap-x overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TabsList className="h-auto w-max min-w-full justify-start">
                        <TabsTrigger className="snap-start px-2.5 text-xs sm:px-3 sm:text-sm" value="overview">
                            {t('campaignDetail.overview')}
                        </TabsTrigger>
                        <TabsTrigger className="snap-start px-2.5 text-xs sm:px-3 sm:text-sm" value="status">
                            {t('campaignDetail.status')}
                        </TabsTrigger>
                        <TabsTrigger className="snap-start px-2.5 text-xs sm:px-3 sm:text-sm" value="influencer">
                            {t('campaignDetail.influencer')}
                        </TabsTrigger>
                        <TabsTrigger className="snap-start px-2.5 text-xs sm:px-3 sm:text-sm" value="customers">
                            {t('campaignDetail.customers')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="w-full min-w-0">
                    {campaign && <OverviewTab campaign={campaign} />}
                </TabsContent>
                <TabsContent value="customers" className="w-full min-w-0">
                    {campaign && <CustomersTab campaign={campaign} onChanged={reloadCampaign} />}
                </TabsContent>
                <TabsContent value="influencer" className="w-full min-w-0">
                    {campaign && <InfluencerTab campaign={campaign} onChanged={reloadCampaign} />}
                </TabsContent>
                <TabsContent value="status" className="w-full min-w-0">
                    {campaign && <StatusTab campaign={campaign} onChanged={reloadCampaign} />}
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default CampaignDetailPage
