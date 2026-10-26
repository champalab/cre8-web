import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SafeImage from '@/components/ui/SafeImage'
import { CampaignInfluencer } from '../campaign.api'
import { Users, TrendingUp, Smartphone, Maximize2 } from 'lucide-react'
import { ImagePreviewDialog } from './ImagePreviewDialog'

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
)

const formatViewsCompact = (value: number) => {
    const num = Number(value || 0)
    if (num < 100000) {
        return new Intl.NumberFormat('en-US').format(num)
    }
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
}
const formatViews = (value: number) => new Intl.NumberFormat('en-US').format(Number(value || 0))

const resolveImageUrl = (url: string | null | undefined) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${(import.meta.env.VITE_APP_API_PATH || '').replace('/v1', '')}${url}`
}

export interface InfluencerCardProps {
    influencer: CampaignInfluencer
    rank: number
    totalCampaignViews: number
    viewsByPlatform: { platform_name: string; count: number }[]
    onPreviewImage?: (data: { url: string; name: string }) => void
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
    influencer,
    rank,
    totalCampaignViews,
    onPreviewImage
}) => {
    const { t } = useTranslation('app')
    const [localPreviewOpen, setLocalPreviewOpen] = useState(false)

    const totalViews = influencer.campaign_post_links.reduce((sum, p) => sum + Number(p.count || 0), 0)
    const percentage = totalCampaignViews > 0 ? (totalViews / totalCampaignViews) * 100 : 0

    const isTop1 = rank === 1
    const imageUrl = resolveImageUrl(influencer.profile_url)

    const handleImageClick = () => {
        if (!imageUrl) return
        if (onPreviewImage) {
            onPreviewImage({ url: imageUrl, name: influencer.actor_name })
        } else {
            setLocalPreviewOpen(true)
        }
    }

    return (
        <article
            className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all border ${isTop1 ? 'border-indigo-500/30' : 'border-slate-200 dark:border-slate-800'} relative overflow-hidden group`}
        >
            {isTop1 && (
                <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-2xl pointer-events-none"></div>
            )}

            <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-center sm:items-start xl:items-center gap-5 sm:gap-6 text-center sm:text-left w-full xl:w-2/3">
                    <div className="relative flex-shrink-0">
                        <div
                            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr ${isTop1 ? 'from-indigo-600 via-indigo-500 to-teal-500' : 'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'} shadow-xl group-hover:scale-105 transition-transform duration-300`}
                        >
                            <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                                {influencer.profile_url ? (
                                    <button
                                        type="button"
                                        onClick={handleImageClick}
                                        aria-label={t('publicCampaign.previewImage', 'ເບິ່ງຮູບຂະໜາດໃຫຍ່')}
                                        title={t('publicCampaign.clickToEnlarge', 'ຄລິກເພື່ອເບິ່ງຮູບໃຫຍ່')}
                                        className="w-full h-full block relative group/avatar cursor-zoom-in text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-[22px] overflow-hidden"
                                    >
                                        <SafeImage
                                            src={imageUrl}
                                            alt={influencer.actor_name}
                                            variant="avatar"
                                            fallbackName={influencer.actor_name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[1px]">
                                            <Maximize2 className="w-6 h-6 drop-shadow-md text-white" />
                                            <span className="text-[10px] font-semibold tracking-wide drop-shadow font-lao">
                                                {t('publicCampaign.clickToEnlarge', 'ເບິ່ງຮູບໃຫຍ່')}
                                            </span>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Users className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {isTop1 && (
                            <div className="absolute -top-2 -left-2 bg-gradient-to-r from-rose-500 to-rose-400 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide font-lao">
                                {t('publicCampaign.topOne')}
                            </div>
                        )}
                        {!isTop1 && rank <= 3 && (
                            <div className="absolute -top-2 -left-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide border border-slate-300 dark:border-slate-700 font-lao">
                                {t('publicCampaign.rankCreator', { rank })}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h3 className="text-xl sm:text-2xl text-slate-900 dark:text-white font-extrabold tracking-tight font-lao">
                                {influencer.actor_name}
                            </h3>
                            {isTop1 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20 font-lao">
                                    {t('publicCampaign.topContributor')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-2 font-lao">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                @{influencer.actor_name.replace(/\s+/g, '').toLowerCase()}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{t('publicCampaign.contentProducer')}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-lao">
                            {influencer.campaign_post_links.length} {t('publicCampaign.postsCombined')}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col min-w-[240px] xl:max-w-[320px] w-full xl:w-auto font-lao shrink-0 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('publicCampaign.totalViews')}</span>
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{t('publicCampaign.totalCreatorViews')}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ml-4 shrink-0">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex flex-col mt-2">
                        <div className="flex items-end gap-2 flex-wrap">
                            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none" title={formatViews(totalViews)}>
                                {formatViewsCompact(totalViews)}
                            </span>
                            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">({percentage.toFixed(1)}%)</span>
                        </div>
                        {totalViews >= 100000 && <span className="text-xs text-slate-500 mt-1.5 font-mono">{formatViews(totalViews)}</span>}
                    </div>

                    <div className="w-full mt-4 bg-slate-200 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">{t('publicCampaign.platformShare')}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-medium text-xs">
                            {percentage.toFixed(1)}% {t('publicCampaign.ofCampaign')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pt-6">
                <div className="flex items-center justify-between mb-4 font-lao">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('publicCampaign.livePostDeliverables')}</h4>
                    <span className="text-[11px] text-slate-400">{t('publicCampaign.postsCount', { count: influencer.campaign_post_links.length })}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {influencer.campaign_post_links.length === 0 && <div className="text-sm text-slate-500">{t('publicCampaign.noCampaignPosts')}</div>}
                    {influencer.campaign_post_links.map((post, idx) => {
                        const isFb = post.platform_name.toLowerCase() === 'facebook'
                        const postPct = totalViews > 0 ? (Number(post.count || 0) / totalViews) * 100 : 0

                        return (
                            <div
                                key={post.post_url + idx}
                                className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3 font-lao">
                                        <div
                                            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${isFb ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'} shadow-md`}
                                        >
                                            {isFb ? <Facebook className="w-8 h-8 text-black" /> : <Smartphone className="w-8 h-8 text-black" />}
                                            <span className="text-base text-black font-extrabold tracking-wide uppercase">{post.platform_name}</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[11px] font-semibold">
                                            {t('publicCampaign.completed')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col mt-4 font-lao">
                                        <div className="text-xs text-slate-500 font-medium mb-1">{t('publicCampaign.recordedViews')}</div>
                                        <div className="flex items-baseline gap-2">
                                            <span
                                                className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                                                title={formatViews(post.count)}
                                            >
                                                {formatViewsCompact(post.count)}
                                            </span>
                                            <span
                                                className="text-sm font-bold text-indigo-600 dark:text-indigo-400"
                                                title={`${postPct.toFixed(1)}% of creator's total views`}
                                            >
                                                ({postPct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        {post.count >= 100000 && <div className="text-[11px] text-slate-400 font-mono mt-1">{formatViews(post.count)}</div>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {!onPreviewImage && (
                <ImagePreviewDialog
                    open={localPreviewOpen}
                    onOpenChange={setLocalPreviewOpen}
                    src={imageUrl}
                    title={influencer.actor_name}
                    subtitle={`@${influencer.actor_name.replace(/\s+/g, '').toLowerCase()}`}
                />
            )}
        </article>
    )
}
