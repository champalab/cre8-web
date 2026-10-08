import React from 'react'
import { useTranslation } from 'react-i18next'
import {
    Activity,
    Bookmark,
    Eye,
    Heart,
    Link2,
    MessageCircle,
    Repeat2,
    Share2,
    Target,
    Users
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/utils/datetime'
import { CampaignDetail } from '@/stores/services/campaignApi'
import { CampaignPerformanceData } from '@/pages/public/campaigns/campaign.api'
import { KPICards } from '@/pages/public/campaigns/components/KPICards'
import { InfluencerCard } from '@/pages/public/campaigns/components/InfluencerCard'
import { InsightsSidebar } from '@/pages/public/campaigns/components/InsightsSidebar'

interface OverviewTabProps {
    campaign: CampaignDetail
    performanceData?: CampaignPerformanceData | null
    isLoadingPerformance?: boolean
}

const numberFormat = (value: number | null | undefined) =>
    value == null ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })

const EmptyState: React.FC = () => {
    const { t } = useTranslation('app')
    return (
        <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-lao">{t('publicCampaign.noInfluencers')}</h3>
            <p className="text-sm text-slate-500 max-w-md font-lao">{t('publicCampaign.noInfluencersDesc')}</p>
        </div>
    )
}

export default function OverviewTab({ campaign, performanceData }: OverviewTabProps) {
    const { t } = useTranslation('app')

    const effectiveData: CampaignPerformanceData = performanceData || {
        uuid: campaign.uuid || '',
        title: campaign.title || '',
        description: campaign.description || null,
        total_views: campaign.total_view || campaign.overview?.totals?.views_count || 0,
        views_by_platform:
            campaign.overview?.platforms?.map((p) => ({
                platform_name: p.name,
                count: p.views || 0
            })) || [],
        campaign_influencers: []
    }

    const o = campaign.overview
    const totals = o?.totals
    const views = totals?.views_count ?? campaign.total_view ?? effectiveData.total_views ?? 0
    const target = campaign.target_views
    const progress = target && views != null && target > 0 ? (views / target) * 100 : null
    const posts = campaign.post_link_summary?.total ?? 0
    const interactions =
        totals && Object.entries(totals).some(([key, value]) => key !== 'views_count' && value != null)
            ? Object.entries(totals).reduce((sum, [key, value]) => sum + (key === 'views_count' ? 0 : value ?? 0), 0)
            : null
    const rate = views && interactions != null && views > 0 ? (interactions / views) * 100 : null
    const coverage = posts && o && posts > 0 ? (o.measured_posts / posts) * 100 : null

    const rankedInfluencers = [...(effectiveData.campaign_influencers || [])].sort((a, b) => {
        const sumA = a.campaign_post_links.reduce((acc, p) => acc + Number(p.count || 0), 0)
        const sumB = b.campaign_post_links.reduce((acc, p) => acc + Number(p.count || 0), 0)
        return sumB - sumA
    })

    const secondaryMetrics = [
        { key: 'views', value: views, icon: Eye },
        { key: 'likes', value: totals?.likes_count ?? campaign.total_like, icon: Heart },
        { key: 'comments', value: totals?.comments_count ?? campaign.total_comment, icon: MessageCircle },
        { key: 'shares', value: totals?.shares_count ?? campaign.total_share, icon: Share2 },
        { key: 'saves', value: totals?.saves_count ?? campaign.total_save, icon: Bookmark },
        { key: 'reposts', value: totals?.reposts_count ?? campaign.total_repost, icon: Repeat2 }
    ]

    return (
        <div className="space-y-10 pb-12">
            {/* Target Views Goal Progress Card (if target is set) */}
            {target != null && target > 0 && (
                <div className="pdf-avoid-break bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white font-lao">{t('campaigns.viewProgress')}</h3>
                                <p className="text-xs text-slate-500 font-lao">
                                    {formatDate(campaign.start_date)} — {formatDate(campaign.end_date)}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                                progress != null && progress >= 100
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                            }`}
                        >
                            {progress != null && progress >= 100 ? t('campaigns.viewTargetReached') : `${numberFormat(progress)}% Goal`}
                        </Badge>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
                        <div>
                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                                    {numberFormat(views)}
                                </span>
                                <span className="text-slate-500 font-medium">/ {numberFormat(target)} {t('metrics.views')}</span>
                            </div>

                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60" aria-hidden="true">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        progress != null && progress >= 100
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                            : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-medium text-slate-500 font-lao">
                                <strong>{progress == null ? '—' : `${numberFormat(progress)}%`}</strong>
                                <span>
                                    {views >= target
                                        ? t('campaigns.viewTargetReached')
                                        : t('campaigns.viewsRemaining', {
                                              count: target - views,
                                              formattedCount: (target - views).toLocaleString('en-US')
                                          })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: t('campaignDetail.interactions'), value: numberFormat(interactions) },
                                { label: t('ownerOverview.interactionRate'), value: rate == null ? '—' : `${numberFormat(rate)}%` },
                                {
                                    label: t('ownerOverview.averageViews'),
                                    value: views != null && o?.views_measured_posts ? numberFormat(views / o.views_measured_posts) : '—'
                                },
                                { label: t('ownerOverview.coverage'), value: coverage == null ? '—' : `${numberFormat(coverage)}%` }
                            ].map((item) => (
                                <div key={item.label} className="min-w-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
                                    <p className="text-xs text-slate-500 font-lao">{item.label}</p>
                                    <p className="mt-1.5 break-words text-lg font-bold text-slate-900 dark:text-white tabular-nums">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3 Modern KPI Cards from Public Campaigns */}
            <div className="pdf-avoid-break">
                <KPICards campaign={effectiveData} />
            </div>

            {/* 2-Column Influencer Matrix & Insights Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (8 cols): Influencer Matrix */}
                <section className="lg:col-span-8 flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-lao">
                                    {t('publicCampaign.influencerMatrix')}
                                </h2>
                                <p className="text-sm text-slate-500 font-lao">{t('publicCampaign.creatorProfiles')}</p>
                            </div>
                        </div>
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 font-lao">
                            {t('publicCampaign.creatorsCount', { count: rankedInfluencers.length })}
                        </div>
                    </div>

                    {rankedInfluencers.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="flex flex-col gap-8">
                            {rankedInfluencers.map((inf, idx) => (
                                <div key={inf.actor_name + idx} className="pdf-avoid-break">
                                    <InfluencerCard
                                        influencer={inf}
                                        rank={idx + 1}
                                        totalCampaignViews={effectiveData.total_views}
                                        viewsByPlatform={effectiveData.views_by_platform}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Right Column (4 cols): Insights Sidebar */}
                <div className="lg:col-span-4 pdf-avoid-break h-max">
                    <InsightsSidebar campaign={effectiveData} />
                </div>
            </div>

            {/* Engagement Metrics Row */}
            <div className="pdf-avoid-break space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-lao">
                        {t('campaignDetail.engagementReport', 'Engagement Metrics')}
                    </h3>
                    <span className="text-xs text-slate-500 font-lao">{t('campaignDetail.engagementHint', 'Live social signals')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {secondaryMetrics.map((item) => (
                        <Card
                            key={item.key}
                            className="min-w-0 space-y-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <item.icon className="w-4 h-4" />
                            </div>
                            <p className="text-xs text-slate-500 font-lao">{t(`metrics.${item.key}`)}</p>
                            <p className="break-words text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                                {numberFormat(item.value)}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Operations Delivery & Data Health Cards */}
            <div className="pdf-avoid-break grid gap-6 lg:grid-cols-2">
                <Card className="space-y-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white font-lao">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        {t('ownerOverview.delivery')}
                    </h3>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {[
                            [t('campaignDetail.influencersCount'), campaign.post_link_summary?.influencers],
                            [t('ownerOverview.approved'), o?.approved_influencers],
                            [t('ownerOverview.pending'), o?.pending_influencers],
                            [t('ownerOverview.rejected'), o?.rejected_influencers],
                            [t('campaignDetail.postLinks'), posts],
                            [t('ownerOverview.platformCount'), o?.platforms?.length]
                        ].map(([label, val]) => (
                            <div key={label as string} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <dt className="text-xs text-slate-500 font-lao">{label}</dt>
                                <dd className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{numberFormat(val as number | undefined)}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>

                <Card className="space-y-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white font-lao">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        {t('ownerOverview.dataHealth')}
                    </h3>
                    <dl className="grid grid-cols-3 gap-3">
                        {[
                            [t('ownerOverview.measured'), o?.measured_posts],
                            [t('ownerOverview.missing'), o?.missing_posts],
                            [t('ownerOverview.errors'), o?.error_posts]
                        ].map(([label, val]) => (
                            <div key={label as string} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <dt className="text-xs text-slate-500 font-lao">{label}</dt>
                                <dd className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{numberFormat(val as number | undefined)}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="text-xs text-slate-500 font-lao pt-1">
                        {t('ownerOverview.lastUpdated')}: {o?.last_checked_at ? formatDateTime(o.last_checked_at) : '—'}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-400 font-lao">{t('ownerOverview.dataNote')}</p>
                </Card>
            </div>

            {/* Campaign Description / Brief */}
            {campaign.description && (
                <div className="pdf-avoid-break p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-white font-lao">{t('campaignDetail.campaignInfo')}</h3>
                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400 font-lao leading-relaxed">
                        {campaign.description}
                    </p>
                </div>
            )}
        </div>
    )
}
