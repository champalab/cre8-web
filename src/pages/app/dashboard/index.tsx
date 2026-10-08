import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Calendar,
    Clock,
    ExternalLink,
    Eye,
    Flame,
    Globe,
    Link2,
    Megaphone,
    RotateCw,
    ThumbsUp,
    Trophy,
    Users
} from 'lucide-react'
import { useGetDashboardQuery } from '../../../stores/services/dashboardApi'
import { formatDate } from '@/utils/datetime'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Social platform SVG icons
const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
)

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
)

const YoutubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
    </svg>
)

const TiktokIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.37a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3.1 15.65a6.34 6.34 0 0 0 10.82 4.48c.03-.03.07-.06.1-.09V11.2a8.27 8.27 0 0 0 5.57 2.14V9.89a4.84 4.84 0 0 1-2.91-3.2z" />
    </svg>
)

interface StatCardProps {
    label: string
    value: number | undefined
    icon: React.ReactNode
    colorClass: {
        bg: string
        text: string
        iconBg: string
        borderHover: string
        gradient: string
    }
    loading: boolean
    to: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass, loading, to }) => (
    <RouterLink
        to={to}
        className="group relative block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
        <Card
            className={cn(
                'relative overflow-hidden rounded-2xl border transition-all duration-300',
                'bg-card hover:bg-card/90 hover:-translate-y-1 hover:shadow-lg',
                colorClass.borderHover
            )}
        >
            {/* Ambient subtle background gradient */}
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-75',
                    colorClass.gradient
                )}
            />

            <CardContent className="relative flex items-center justify-between p-6">
                <div className="space-y-1.5 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    {loading ? (
                        <Skeleton className="h-9 w-28 rounded-lg" />
                    ) : (
                        <p className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                            {(value ?? 0).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="relative flex items-center gap-2">
                    <div
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110',
                            colorClass.iconBg,
                            colorClass.text
                        )}
                    >
                        {icon}
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </CardContent>
        </Card>
    </RouterLink>
)

const PlatformBadge: React.FC<{ name?: string }> = ({ name }) => {
    const raw = (name || '').toLowerCase()

    if (raw.includes('tiktok')) {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-neutral-300 bg-neutral-100/80 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100"
            >
                <TiktokIcon className="size-3.5 fill-current" />
                <span>TikTok</span>
            </Badge>
        )
    }

    if (raw.includes('facebook') || raw.includes('fb')) {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300"
            >
                <FacebookIcon className="size-3.5" />
                <span>Facebook</span>
            </Badge>
        )
    }

    if (raw.includes('instagram') || raw.includes('ig')) {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-pink-200 bg-pink-50/80 text-pink-700 dark:border-pink-900/60 dark:bg-pink-950/60 dark:text-pink-300"
            >
                <InstagramIcon className="size-3.5" />
                <span>Instagram</span>
            </Badge>
        )
    }

    if (raw.includes('youtube') || raw.includes('yt')) {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-red-200 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
            >
                <YoutubeIcon className="size-3.5" />
                <span>YouTube</span>
            </Badge>
        )
    }

    return (
        <Badge variant="outline" className="gap-1.5">
            <Globe className="size-3 text-muted-foreground" />
            <span>{name || 'Platform'}</span>
        </Badge>
    )
}

const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const Dashboard: React.FC = () => {
    const { t } = useTranslation('app')
    const { data: res, isLoading, isFetching, refetch } = useGetDashboardQuery()
    const d = res?.data

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header with Live Indicator & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-xs">
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                        </span>
                        <span>{t('dashboard.liveData')}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-8 gap-1.5 text-xs shadow-xs"
                    >
                        <RotateCw className={cn('size-3.5', isFetching && 'animate-spin text-primary')} />
                        <span>{t('dashboard.refresh')}</span>
                    </Button>
                </div>
            </div>

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('dashboard.statActors')}
                    value={d?.summary?.totalActors}
                    icon={<Users className="size-6" />}
                    colorClass={{
                        bg: 'bg-indigo-500/10',
                        text: 'text-indigo-600 dark:text-indigo-400',
                        iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
                        borderHover: 'hover:border-indigo-500/40',
                        gradient: 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent'
                    }}
                    loading={isLoading}
                    to="/app/influencers"
                />

                <StatCard
                    label={t('dashboard.statCampaigns')}
                    value={d?.summary?.totalCampaigns}
                    icon={<Megaphone className="size-6" />}
                    colorClass={{
                        bg: 'bg-emerald-500/10',
                        text: 'text-emerald-600 dark:text-emerald-400',
                        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                        borderHover: 'hover:border-emerald-500/40',
                        gradient: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                    }}
                    loading={isLoading}
                    to="/app/campaigns"
                />

                <StatCard
                    label={t('dashboard.statPostLinks')}
                    value={d?.summary?.totalAssignments}
                    icon={<Link2 className="size-6" />}
                    colorClass={{
                        bg: 'bg-amber-500/10',
                        text: 'text-amber-600 dark:text-amber-400',
                        iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
                        borderHover: 'hover:border-amber-500/40',
                        gradient: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent'
                    }}
                    loading={isLoading}
                    to="/app/campaigns"
                />

                <StatCard
                    label={t('dashboard.statViewLogs')}
                    value={d?.summary?.totalViewLogs}
                    icon={<BarChart3 className="size-6" />}
                    colorClass={{
                        bg: 'bg-rose-500/10',
                        text: 'text-rose-600 dark:text-rose-400',
                        iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
                        borderHover: 'hover:border-rose-500/40',
                        gradient: 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent'
                    }}
                    loading={isLoading}
                    to="/app/view-logs"
                />
            </div>

            {/* Mid Section: Top Influencers & Active Campaigns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Influencers */}
                <Card className="rounded-2xl border-border/80 shadow-xs flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="flex items-center gap-2.5 text-base font-bold">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Trophy className="size-4" />
                            </span>
                            <span>{t('dashboard.topActors')}</span>
                        </CardTitle>
                        <RouterLink
                            to="/app/influencers"
                            className="group flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <span>{t('dashboard.viewAll')}</span>
                            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </RouterLink>
                    </CardHeader>

                    <CardContent className="flex-1">
                        {isLoading ? (
                            <div className="space-y-3 py-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (d?.topActors?.length ?? 0) === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Users className="size-10 text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.noTopActors')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {d!.topActors.map((actor, idx) => {
                                    const views = Number(actor.total_views || 0)
                                    const likes = Number(actor.total_likes || 0)
                                    const engagementRate = views > 0 ? ((likes / views) * 100).toFixed(1) : null

                                    return (
                                        <RouterLink
                                            key={actor.actor_id}
                                            to="/app/influencers"
                                            className={cn(
                                                'group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-200',
                                                'hover:bg-muted/40 hover:border-primary/30 hover:shadow-xs',
                                                idx === 0
                                                    ? 'border-amber-500/25 bg-amber-500/[0.03]'
                                                    : 'border-border/60 bg-card'
                                            )}
                                        >
                                            {/* Rank + Avatar + Name */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={cn(
                                                        'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold',
                                                        idx === 0
                                                            ? 'bg-amber-500 text-white shadow-xs'
                                                            : idx === 1
                                                            ? 'bg-slate-400/30 text-foreground'
                                                            : idx === 2
                                                            ? 'bg-amber-700/20 text-amber-800 dark:text-amber-500'
                                                            : 'bg-muted text-muted-foreground'
                                                    )}
                                                >
                                                    {idx + 1}
                                                </div>

                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                    {getInitials(actor.name)}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {actor.name}
                                                    </p>
                                                    {engagementRate && (
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Flame className="size-3 text-amber-500" />
                                                            <span>{engagementRate}% {t('dashboard.engagement')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Views & Likes Badges */}
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 font-mono text-xs tabular-nums bg-primary/10 text-primary border-primary/20"
                                                >
                                                    <Eye className="size-3" />
                                                    {views.toLocaleString()}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 font-mono text-xs tabular-nums border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                                >
                                                    <ThumbsUp className="size-3" />
                                                    {likes.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </RouterLink>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Campaigns */}
                <Card className="rounded-2xl border-border/80 shadow-xs flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="flex items-center gap-2.5 text-base font-bold">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Megaphone className="size-4" />
                            </span>
                            <span>{t('dashboard.activeCampaigns')}</span>
                        </CardTitle>
                        <RouterLink
                            to="/app/campaigns"
                            className="group flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <span>{t('dashboard.viewAll')}</span>
                            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </RouterLink>
                    </CardHeader>

                    <CardContent className="flex-1">
                        {isLoading ? (
                            <div className="space-y-3 py-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (d?.activeCampaigns?.length ?? 0) === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Megaphone className="size-10 text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">{t('dashboard.noActiveCampaigns')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {d!.activeCampaigns.map((camp) => (
                                    <RouterLink
                                        key={camp.id}
                                        to="/app/campaigns"
                                        className={cn(
                                            'group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200',
                                            'hover:bg-muted/40 hover:border-emerald-500/30 hover:shadow-xs'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                                                <p className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                                    {camp.title}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="shrink-0 gap-1 text-[11px] font-medium"
                                            >
                                                <Link2 className="size-3" />
                                                {t('dashboard.postLinksCount', { count: camp._count.post_links ?? 0 })}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            {camp.end_date ? (
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Calendar className="size-3" />
                                                    {t('dashboard.ends', { date: formatDate(camp.end_date) })}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Ongoing</span>
                                            )}
                                            <ArrowRight className="size-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 text-primary" />
                                        </div>
                                    </RouterLink>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Recent Post Links Table */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-base font-bold">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Activity className="size-4" />
                        </span>
                        <span>{t('dashboard.recentPostLinks')}</span>
                    </CardTitle>
                    <RouterLink
                        to="/app/view-logs"
                        className="group flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <span>{t('dashboard.viewAll')}</span>
                        <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </RouterLink>
                </CardHeader>

                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    {isLoading ? (
                        <div className="space-y-3 p-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (d?.recentAssignments?.length ?? 0) === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Activity className="size-10 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">{t('dashboard.noRecentLinks')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider">
                                            {t('dashboard.colActor')}
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                                            {t('dashboard.colCampaign')}
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider">
                                            {t('dashboard.colPlatform')}
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                                            {t('metrics.views')}
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                                            {t('metrics.likes')}
                                        </TableHead>
                                        <TableHead className="text-center text-xs font-semibold uppercase tracking-wider">
                                            {t('dashboard.openPost')}
                                        </TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                                            {t('dashboard.colUpdated')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {d!.recentAssignments.map((row) => (
                                        <TableRow key={row.id} className="transition-colors hover:bg-muted/30">
                                            {/* Actor */}
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {getInitials(row.actors?.name)}
                                                    </div>
                                                    <span className="font-semibold text-sm truncate max-w-[140px]">
                                                        {row.actors?.name ?? `#${row.actor_id}`}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Campaign */}
                                            <TableCell>
                                                <span className="font-medium text-sm text-foreground/90 truncate max-w-[180px] block">
                                                    {row.campaigns?.title ?? `#${row.campaign_id}`}
                                                </span>
                                            </TableCell>

                                            {/* Platform */}
                                            <TableCell>
                                                <PlatformBadge name={row.social_platforms?.name} />
                                            </TableCell>

                                            {/* Views */}
                                            <TableCell className="text-right font-mono font-bold text-sm text-primary tabular-nums">
                                                {Number(row.latest_views || 0).toLocaleString()}
                                            </TableCell>

                                            {/* Likes */}
                                            <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {Number(row.latest_likes || 0).toLocaleString()}
                                            </TableCell>

                                            {/* Post URL Link */}
                                            <TableCell className="text-center">
                                                {row.post_url ? (
                                                    <a
                                                        href={row.post_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                        title={row.post_url}
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                        <span className="hidden sm:inline">{t('dashboard.openPost')}</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>

                                            {/* Updated Date */}
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Clock className="size-3" />
                                                    <span>{formatDate(row.updated_at)}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default Dashboard
