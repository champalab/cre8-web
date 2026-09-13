import { useTranslation } from 'react-i18next'
import { Eye, Heart, MessageCircle, Share2, Bookmark, Repeat2, Target, Users, Link2, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/utils/datetime'
import { CampaignDetail } from '@/stores/services/campaignApi'

type Props = { campaign: CampaignDetail }
const number = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 })

export default function OverviewTab({ campaign }: Props) {
    const { t } = useTranslation('app')
    const o = campaign.overview
    const totals = o?.totals
    const views = totals?.views_count
    const target = campaign.target_views
    const progress = target && views != null ? views / target * 100 : null
    const posts = campaign.post_link_summary?.total ?? 0
    const interactions = totals && Object.entries(totals).some(([key, value]) => key !== 'views_count' && value != null)
        ? Object.entries(totals).reduce((sum, [key, value]) => sum + (key === 'views_count' ? 0 : value ?? 0), 0) : null
    const rate = views && interactions != null ? interactions / views * 100 : null
    const coverage = posts && o ? o.measured_posts / posts * 100 : null
    const metrics = [
        { key: 'views', value: views, icon: Eye }, { key: 'likes', value: totals?.likes_count, icon: Heart },
        { key: 'comments', value: totals?.comments_count, icon: MessageCircle }, { key: 'shares', value: totals?.shares_count, icon: Share2 },
        { key: 'saves', value: totals?.saves_count, icon: Bookmark }, { key: 'reposts', value: totals?.reposts_count, icon: Repeat2 },
    ]
    return (
        <div className="space-y-5">
            <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('ownerOverview.title')}</p>
                        <h2 className="mt-2 text-2xl font-bold">{campaign.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{campaign.campaign_code} · {formatDate(campaign.start_date)} — {formatDate(campaign.end_date)}</p>
                    </div>
                    <Badge variant="outline">{t(`status.${(campaign.status || 'DRAFT').toLowerCase()}`, { defaultValue: campaign.status || 'DRAFT' })}</Badge>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-medium"><Target className="size-4" />{t('campaigns.viewProgress')}</p>
                        <div className="my-3 flex flex-wrap items-baseline gap-3"><span className="text-4xl font-bold tabular-nums">{number(views)}</span><span className="text-muted-foreground">/ {number(target)} {t('metrics.views')}</span></div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className={`h-full rounded-full ${progress != null && progress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }} /></div>
                        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                            <strong>{progress == null ? '—' : `${number(progress)}%`}</strong>
                            <span>{!target ? t('campaigns.noViewTarget') : views == null ? t('ownerOverview.waitingData') : views >= target ? t('campaigns.viewTargetReached') : t('campaigns.viewsRemaining', { count: target - views, formattedCount: (target - views).toLocaleString('en-US') })}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: t('campaignDetail.interactions'), value: number(interactions) },
                            { label: t('ownerOverview.interactionRate'), value: rate == null ? '—' : `${number(rate)}%` },
                            { label: t('ownerOverview.averageViews'), value: views != null && o?.views_measured_posts ? number(views / o.views_measured_posts) : '—' },
                            { label: t('ownerOverview.coverage'), value: coverage == null ? '—' : `${number(coverage)}%` },
                        ].map(item => <div key={item.label} className="min-w-0 rounded-xl border bg-background/70 p-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums">{item.value}</p></div>)}
                    </div>
                </div>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{t('ownerOverview.method')}</p>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                {metrics.map(item => <Card key={item.key} className="min-w-0 space-y-2 rounded-xl p-4"><item.icon className="size-5 text-primary" /><p className="text-xs text-muted-foreground">{t(`metrics.${item.key}`)}</p><p className="break-words text-xl font-bold tabular-nums">{number(item.value)}</p></Card>)}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-4 p-5">
                    <h3 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" />{t('ownerOverview.delivery')}</h3>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {[
                            [t('campaignDetail.influencersCount'), campaign.post_link_summary?.influencers],
                            [t('ownerOverview.approved'), o?.approved_influencers], [t('ownerOverview.pending'), o?.pending_influencers],
                            [t('ownerOverview.rejected'), o?.rejected_influencers], [t('campaignDetail.postLinks'), posts],
                            [t('ownerOverview.platformCount'), o?.platforms.length],
                        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{number(value as number | undefined)}</dd></div>)}
                    </dl>
                </Card>
                <Card className="space-y-4 p-5">
                    <h3 className="flex items-center gap-2 font-semibold"><Activity className="size-4 text-primary" />{t('ownerOverview.dataHealth')}</h3>
                    <dl className="grid grid-cols-3 gap-3">
                        {[[t('ownerOverview.measured'), o?.measured_posts], [t('ownerOverview.missing'), o?.missing_posts], [t('ownerOverview.errors'), o?.error_posts]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{number(value as number | undefined)}</dd></div>)}
                    </dl>
                    <p className="text-xs text-muted-foreground">{t('ownerOverview.lastUpdated')}: {o?.last_checked_at ? formatDateTime(o.last_checked_at) : '—'}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t('ownerOverview.dataNote')}</p>
                </Card>
                <Card className="space-y-4 p-5">
                    <h3 className="flex items-center gap-2 font-semibold"><Link2 className="size-4 text-primary" />{t('ownerOverview.platforms')}</h3>
                    {o?.platforms.map(platform => <div key={platform.name} className="space-y-2">
                        <div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{platform.name}</strong><span>{platform.views_measured ? number(platform.views) : '—'} {t('metrics.views')}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full bg-primary" style={{ width: `${views ? platform.views / views * 100 : 0}%` }} /></div>
                        <p className="text-xs text-muted-foreground">{platform.posts} {t('campaignDetail.postLinks')} · {platform.interactions_measured ? number(platform.interactions) : '—'} {t('campaignDetail.interactions')}</p>
                    </div>)}
                    {!o?.platforms.length && <p className="text-sm text-muted-foreground">{t('common:noData')}</p>}
                </Card>
                <Card className="space-y-4 p-5">
                    <h3 className="font-semibold">{t('ownerOverview.topActors')}</h3>
                    {o?.top_actors.map((actor, index) => <div key={actor.id} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                        <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{actor.name}</p><p className="mt-1 text-xs text-muted-foreground">{actor.posts} {t('campaignDetail.postLinks')} · {actor.interactions_measured ? number(actor.interactions) : '—'} {t('campaignDetail.interactions')}</p></div>
                        <div className="text-right"><p className="text-sm font-bold tabular-nums">{number(actor.views)}</p><p className="text-xs text-muted-foreground">{t('metrics.views')}</p></div>
                    </div>)}
                    {!o?.top_actors.length && <p className="text-sm text-muted-foreground">{t('ownerOverview.waitingData')}</p>}
                </Card>
            </div>
            <Card className="space-y-2 p-5"><h3 className="font-semibold">{t('campaignDetail.campaignInfo')}</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{campaign.description || '—'}</p>
            </Card>
        </div>
    )
}
