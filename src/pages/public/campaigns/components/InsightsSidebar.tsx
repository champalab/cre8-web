import React from 'react'
import { CampaignPerformanceData } from '../campaign.api'
import { useTranslation, Trans } from 'react-i18next'

const formatViewsCompact = (value: number) => {
    const num = Number(value || 0);
    if (num < 100000) {
        return new Intl.NumberFormat('en-US').format(num);
    }
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}
const formatViews = (value: number) => new Intl.NumberFormat('en-US').format(Number(value || 0))

export const InsightsSidebar: React.FC<{ campaign: CampaignPerformanceData }> = ({ campaign }) => {
    const { t } = useTranslation('app')
    const fbCount = campaign.views_by_platform.find(p => p.platform_name.toLowerCase() === 'facebook')?.count || 0
    const tkCount = campaign.views_by_platform.find(p => p.platform_name.toLowerCase() === 'tiktok')?.count || 0

    const total = campaign.total_views || 1
    const fbPct = (fbCount / total) * 100
    const tkPct = (tkCount / total) * 100

    const trackedViews = campaign.views_by_platform.reduce((sum, p) => sum + Number(p.count || 0), 0)
    const attributionPct = Math.min(100, (trackedViews / total) * 100).toFixed(1)

    // Circumference of the SVG circle (r=38, 2 * PI * 38 = ~238.76)
    const circumference = 238.76
    const fbDasharray = `${(fbPct / 100) * circumference} ${circumference}`
    const tkDasharray = `${(tkPct / 100) * circumference} ${circumference}`
    // Offset for TikTok slice starts after FB slice
    const tkDashoffset = -((fbPct / 100) * circumference)

    return (
        <aside className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-lao">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('publicCampaign.platformShareOverview')}</h3>
                        <span className="text-sm text-slate-500">{t('publicCampaign.breakdownOverview')}</span>
                    </div>
                </div>

                <div className="relative flex items-center justify-center my-4">
                    <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 100 100">
                        <circle className="text-slate-100 dark:text-slate-800" cx="50" cy="50" fill="transparent" r="38" stroke="currentColor" strokeWidth="12"></circle>
                        <circle className="text-slate-800 dark:text-slate-400" cx="50" cy="50" fill="transparent" r="38" stroke="currentColor" strokeWidth="12" strokeDasharray={tkDasharray} strokeDashoffset={tkDashoffset}></circle>
                        <circle className="text-indigo-600" cx="50" cy="50" fill="transparent" r="38" stroke="currentColor" strokeWidth="12" strokeDasharray={fbDasharray}></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-lao">
                        <span className="text-xs text-slate-500 tracking-widest uppercase font-lao">{t('publicCampaign.total')}</span>
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5" title={formatViews(campaign.total_views)}>{formatViewsCompact(campaign.total_views)}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-6 pt-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Facebook</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white" title={formatViews(fbCount)}>{formatViewsCompact(fbCount)} ({fbPct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${fbPct}%` }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-400"></span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">TikTok</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white" title={formatViews(tkCount)}>{formatViewsCompact(tkCount)} ({tkPct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-slate-800 dark:bg-slate-400 rounded-full" style={{ width: `${tkPct}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-lao">{t('publicCampaign.insightsTitle')}</h3>
                    <p className="text-sm text-slate-500 font-lao">{t('publicCampaign.strategicOverview')}</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex gap-3.5 items-start">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100 font-lao">{t('publicCampaign.dominantPlatform')}</span>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-lao">
                            <Trans
                                ns="app"
                                i18nKey={"publicCampaign.dominantPlatformDesc" as any}
                                values={{
                                    platform: fbPct > tkPct ? 'Facebook' : 'TikTok',
                                    percentage: Math.max(fbPct, tkPct).toFixed(1)
                                }}
                                components={[<span key="bold" className="font-bold" />]}
                            />
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex gap-3.5 items-start">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-lao">{t('publicCampaign.topCreator')}</span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-lao">
                            <Trans
                                ns="app"
                                i18nKey={"publicCampaign.topCreatorDesc" as any}
                                values={{
                                    name: campaign.campaign_influencers.length > 0 ? campaign.campaign_influencers[0].actor_name : 'No creators'
                                }}
                                components={[<span key="bold" className="font-bold" />]}
                            />
                        </p>
                    </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 font-lao">
                    <span>{t('publicCampaign.attribution', { percentage: attributionPct })}</span>
                    <span className="text-teal-600 font-bold">{t('publicCampaign.verifiedData')}</span>
                </div>
            </div>
        </aside>
    )
}
