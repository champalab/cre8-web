import React from 'react'
import { useTranslation } from 'react-i18next'
import { CampaignPerformanceData } from '../campaign.api'

const formatViews = (value: number) => new Intl.NumberFormat('en-US').format(Number(value || 0))

export const KPICards: React.FC<{ campaign: CampaignPerformanceData }> = ({ campaign }) => {
    const { t } = useTranslation('app')

    const fbCount = campaign.views_by_platform.find(p => p.platform_name.toLowerCase() === 'facebook')?.count || 0
    const tkCount = campaign.views_by_platform.find(p => p.platform_name.toLowerCase() === 'tiktok')?.count || 0

    const total = campaign.total_views || 1 // prevent div by zero
    const fbPct = (fbCount / total) * 100
    const tkPct = (tkCount / total) * 100

    return (
        <section className="px-6 mb-12 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* KPI 1: Total Views */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-indigo-500/50 flex flex-col justify-between overflow-hidden group text-white">
                    <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 font-lao">
                            <span className="text-sm text-indigo-100 font-semibold">{t('publicCampaign.totalViews')}</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
                                100% {t('publicCampaign.total')}
                            </span>
                        </div>
                        <div className="text-[11px] text-indigo-200 uppercase tracking-wider font-lao">{t('publicCampaign.totalCombinedViews')}</div>
                        <div className="text-4xl mt-1.5 tracking-tight font-extrabold drop-shadow-sm " title={formatViews(campaign.total_views)}>
                            {campaign?.total_views?.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 flex flex-col gap-1.5 bg-black/10 backdrop-blur-sm -mx-5 -mb-5 px-5 pb-4 border-t border-white/10 relative z-10">
                        <div className="flex items-center justify-between text-[11px] text-indigo-100">
                            <span>Facebook + TikTok</span>
                            <span className="text-teal-300 font-semibold">2 Platforms</span>
                        </div>
                        <div className="w-full h-2 bg-indigo-950/50 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
                            <div className="h-full bg-teal-400" style={{ width: `${fbPct}%` }} title={`Facebook: ${fbPct.toFixed(1)}%`}></div>
                            <div className="h-full bg-white/40" style={{ width: `${tkPct}%` }} title={`TikTok: ${tkPct.toFixed(1)}%`}></div>
                        </div>
                    </div>
                </div>

                {/* KPI 2: Facebook Volume */}
                <div className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
                    <div>
                        <div className="flex items-center justify-between mb-2 font-lao">
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">{t('publicCampaign.facebookViews')}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                Facebook Reel
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-lao">{fbPct.toFixed(1)}% {t('publicCampaign.platformShare')}</div>
                        <div className="text-3xl text-slate-900 dark:text-white mt-1.5 tracking-tight font-extrabold" title={formatViews(fbCount)}>
                            {fbCount?.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-950 -mx-5 -mb-5 px-5 pb-4 border-t border-slate-100 dark:border-slate-800 font-lao">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{t('publicCampaign.primaryChannel')}</span>
                        <span className="text-[11px] text-blue-600 font-bold">{t('publicCampaign.verified')}</span>
                    </div>
                </div>

                {/* KPI 3: TikTok Volume */}
                <div className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900 dark:bg-slate-500"></div>
                    <div>
                        <div className="flex items-center justify-between mb-2 font-lao">
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">{t('publicCampaign.tiktokViews')}</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] font-semibold">
                                TikTok Video
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-lao">{tkPct.toFixed(1)}% {t('publicCampaign.platformShare')}</div>
                        <div className="text-3xl text-slate-900 dark:text-white mt-1.5 tracking-tight font-extrabold" title={formatViews(tkCount)}>
                            {tkCount?.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-950 -mx-5 -mb-5 px-5 pb-4 border-t border-slate-100 dark:border-slate-800 font-lao">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{t('publicCampaign.secondaryChannel')}</span>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">{t('publicCampaign.growing')}</span>
                    </div>
                </div>


            </div>
        </section>
    )
}
