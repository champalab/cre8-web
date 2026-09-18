import React from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { CampaignPerformanceData } from '../campaign.api'

export const CampaignBanner: React.FC<{
    campaign: CampaignPerformanceData
    onRefresh: () => void
    loading: boolean
    onExportPDF?: () => void
    isExporting?: boolean
}> = ({ campaign, onRefresh, loading, onExportPDF, isExporting }) => {
    const { t } = useTranslation('app')

    return (
        <section className="relative px-6 py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm mb-8 overflow-hidden rounded-b-3xl">
            <div className="absolute -right-20 -top-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 max-w-7xl mx-auto">
                <div className="flex flex-col gap-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 font-semibold border border-teal-500/20 text-[11px] uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span>{t('publicCampaign.liveAnalytics')} • Active</span>
                        </div>
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono group cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => navigator.clipboard?.writeText(campaign.uuid)}
                        >
                            <span className="text-slate-400">UUID:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-200">{campaign.uuid}</span>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3 mt-1">
                        <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight font-extrabold">
                            {campaign.title || t('publicCampaign.title')}
                        </h1>
                    </div>
                    <div className="flex items-baseline gap-3 mt-1">
                        <h2 className="text-xl sm:text-1xl text-slate-900 dark:text-white tracking-tight font-extrabold">{campaign.description || ''}</h2>
                    </div>

                    <p className="text-sm text-slate-500 flex flex-wrap items-center gap-2 mt-2 font-lao">
                        <span className="font-semibold text-slate-800 dark:text-slate-300">{t('publicCampaign.reportingWindow')}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">{t('publicCampaign.autoSync')}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                    <button
                        onClick={onRefresh}
                        disabled={loading || isExporting}
                        data-html2canvas-ignore="true"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm font-semibold shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 font-lao"
                    >
                        {loading ? t('publicCampaign.updating') : t('publicCampaign.refresh')}
                    </button>
                    {onExportPDF && (
                        <button
                            onClick={onExportPDF}
                            disabled={isExporting}
                            data-html2canvas-ignore="true"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-sm font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 font-lao"
                        >
                            <Download className="w-4 h-4" />
                            {isExporting ? t('publicCampaign.exporting') : t('publicCampaign.exportPDF')}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const url = window.location.href
                            const title = campaign.title || t('publicCampaign.title')
                            const formattedViews = new Intl.NumberFormat('en-US').format(campaign.total_views || 0)
                            const text = `- ລາຍງານຍອດວິວແຄມເປນ: ${title ?? '-'}\n👩- ຍອດວິວລວມ: ${formattedViews} ວິວ\n\nກົດເບິ່ງລາຍລະອຽດລາຍງານຜົນງານແຄມເປນໄດ້ທີ່ລິ້ງນີ້:\n${url}`
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
                </div>
            </div>
        </section>
    )
}
