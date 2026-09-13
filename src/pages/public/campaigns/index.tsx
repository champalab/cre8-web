import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

import { fetchCampaignPerformance, CampaignPerformanceData } from './campaign.api'
import { CampaignBanner } from './components/CampaignBanner'
import { KPICards } from './components/KPICards'
import { InfluencerCard } from './components/InfluencerCard'
import { InsightsSidebar } from './components/InsightsSidebar'
import { toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'

// --- Loading / Error States ---

const LoadingSkeleton = () => (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0B1120] p-4 md:p-6 lg:p-8 animate-pulse space-y-8">
        <Skeleton className="h-48 w-full max-w-7xl mx-auto rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            <Skeleton className="lg:col-span-8 h-[600px] rounded-3xl" />
            <Skeleton className="lg:col-span-4 h-[600px] rounded-3xl" />
        </div>
    </div>
)

const ErrorState: React.FC<{ message: string, onRetry: () => void }> = ({ message, onRetry }) => {
    const { t } = useTranslation('app')
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-[#0B1120]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('publicCampaign.failedToLoad')}</h2>
            <p className="text-slate-500 mb-6 max-w-md">{message}</p>
            <button onClick={onRetry} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity">
                {t('publicCampaign.tryAgain')}
            </button>
        </div>
    )
}

const EmptyState = () => {
    const { t } = useTranslation('app')
    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('publicCampaign.noInfluencers')}</h3>
            <p className="text-slate-500">{t('publicCampaign.noInfluencersDesc')}</p>
        </div>
    )
}

// --- Main Page ---

const CampaignPerformancePage = () => {
    const { t } = useTranslation('app')
    const { slug } = useParams<{ slug: string }>()
    const [data, setData] = useState<CampaignPerformanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    const loadData = async () => {
        if (!slug) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetchCampaignPerformance(slug)
            if (res) {
                setData(res)
            } else {
                setError(t('publicCampaign.notFound'))
            }
        } catch (err) {
            setError(t('publicCampaign.unexpectedError'))
        } finally {
            setLoading(false)
        }
    }

    const handleExportPDF = async () => {
        const element = document.getElementById('campaign-report-content');
        if (!element) return;
        setIsExporting(true);
        // Wait for React to apply pdf-export-mode classes
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const canvas = await toCanvas(element, {
                cacheBust: true,
                pixelRatio: 2,
                filter: (node) => {
                    if (node.nodeType === 1) {
                        const el = node as HTMLElement;
                        if (el.getAttribute('data-html2canvas-ignore') === 'true') {
                            return false;
                        }
                    }
                    return true;
                }
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const pxToMm = pdfWidth / canvas.width;
            const mmToPx = canvas.width / pdfWidth;
            const pagePxHeight = pdfHeight * mmToPx;

            const elements = Array.from(element.querySelectorAll('.pdf-avoid-break'));
            const parentRect = element.getBoundingClientRect();
            const breakPoints = elements.map(el => {
                const rect = el.getBoundingClientRect();
                return {
                    top: (rect.top - parentRect.top) * 2,
                    bottom: (rect.bottom - parentRect.top) * 2
                };
            });

            let currentY = 0;
            let pageNum = 0;

            while (currentY < canvas.height) {
                let targetBottom = currentY + pagePxHeight;
                
                if (targetBottom >= canvas.height) {
                    targetBottom = canvas.height;
                } else {
                    for (const bp of breakPoints) {
                        if (bp.top < targetBottom && bp.bottom > targetBottom) {
                            if (bp.top > currentY) {
                                targetBottom = bp.top;
                            }
                            break;
                        }
                    }
                }

                const sliceHeight = targetBottom - currentY;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = sliceHeight;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
                    const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
                    
                    if (pageNum > 0) {
                        pdf.addPage();
                    }
                    const mmSliceHeight = sliceHeight * pxToMm;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, mmSliceHeight);
                }

                currentY = targetBottom;
                pageNum++;
            }

            pdf.save(`campaign-report-${slug || 'export'}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsExporting(false);
        }
    }

    useEffect(() => {
        loadData()
    }, [slug])

    if (loading && !data) return <LoadingSkeleton />
    if (error) return <ErrorState message={error} onRetry={loadData} />
    if (!data) return <ErrorState message={t('publicCampaign.campaignNotFound')} onRetry={loadData} />

    const rankedInfluencers = [...data.campaign_influencers].sort((a, b) => {
        const sumA = a.campaign_post_links.reduce((acc, p) => acc + Number(p.count || 0), 0)
        const sumB = b.campaign_post_links.reduce((acc, p) => acc + Number(p.count || 0), 0)
        return sumB - sumA
    })

    return (
        <div id="campaign-report-content" className={`min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500/30 pb-16 ${isExporting ? 'pdf-export-mode' : ''}`}>
            <div className="pdf-avoid-break">
                <CampaignBanner campaign={data} loading={loading} onRefresh={loadData} onExportPDF={handleExportPDF} isExporting={isExporting} />
            </div>
            <div className="pdf-avoid-break">
                <KPICards campaign={data} />
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Influencers */}
                <section className="lg:col-span-8 flex flex-col gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-lao">{t('publicCampaign.influencerMatrix')}</h2>
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
                                        totalCampaignViews={data.total_views}
                                        viewsByPlatform={data.views_by_platform}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Right Column: Insights */}
                <div className="lg:col-span-4 pdf-avoid-break h-max">
                    <InsightsSidebar campaign={data} />
                </div>
            </div>
        </div>
    )
}

export default CampaignPerformancePage
