import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Link, Megaphone, ThumbsUp, TrendingUp, Users } from 'lucide-react'
import { useGetDashboardQuery } from '../../../stores/services/dashboardApi'
import { formatDate } from '@/utils/datetime'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface StatCardProps {
    label: string
    value: number | undefined
    icon: React.ReactNode
    color: string
    loading: boolean
    to: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, loading, to }) => (
    <RouterLink to={to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
    <Card
        className="rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg"
        style={{
            background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
            borderColor: `${color}44`,
            boxShadow: `0 4px 20px ${color}22`
        }}
    >
        <CardContent className="flex items-center gap-4 p-6">
            <div
                className="flex size-14 shrink-0 items-center justify-center rounded-lg shadow-md"
                style={{ backgroundColor: color, boxShadow: `0 4px 12px ${color}66` }}
            >
                {React.isValidElement(icon)
                    ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                          className: 'size-7 text-white'
                      })
                    : icon}
            </div>
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {loading ? (
                    <Skeleton className="mt-1 h-9 w-24" />
                ) : (
                    <p className="text-3xl font-extrabold" style={{ color }}>
                        {(value ?? 0).toLocaleString()}
                    </p>
                )}
            </div>
        </CardContent>
    </Card>
    </RouterLink>
)

const Dashboard: React.FC = () => {
    const { t } = useTranslation('app')
    const { data: res, isLoading } = useGetDashboardQuery()
    const d = res?.data

    return (
        <div>
            <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: t('dashboard.statActors'), value: d?.summary?.totalActors, icon: <Users />, color: '#6366f1', to: '/app/influencers' },
                    { label: t('dashboard.statCampaigns'), value: d?.summary?.totalCampaigns, icon: <Megaphone />, color: '#10b981', to: '/app/campaigns' },
                    { label: t('dashboard.statPostLinks'), value: d?.summary?.totalAssignments, icon: <Link />, color: '#f59e0b', to: '/app/campaigns' },
                    { label: t('dashboard.statViewLogs'), value: d?.summary?.totalViewLogs, icon: <BarChart3 />, color: '#ef4444', to: '/app/view-logs' }
                ].map((s) => (
                    <StatCard key={s.label} {...s} loading={isLoading} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="size-5 text-primary" />
                            {t('dashboard.topActors')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3 py-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : (d?.topActors?.length ?? 0) === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">{t('common:noData')}</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {d!.topActors.map((a, i) => (
                                    <div
                                        key={a.actor_id}
                                        className={`flex items-center gap-4 rounded-lg border p-3 ${
                                            i === 0 ? 'border-primary/20 bg-primary/5' : 'border-border bg-background'
                                        }`}
                                    >
                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                                i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                                            }`}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold">{a.name}</p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Badge variant="outline" className="gap-1">
                                                <Eye className="size-3.5" />
                                                {Number(a.total_views).toLocaleString()}
                                            </Badge>
                                            <Badge variant="outline" className="gap-1 border-green-200 text-green-700">
                                                <ThumbsUp className="size-3.5" />
                                                {Number(a.total_likes).toLocaleString()}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Megaphone className="size-5 text-green-600" />
                            {t('dashboard.activeCampaigns')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3 py-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : (d?.activeCampaigns?.length ?? 0) === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">{t('common:noData')}</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {d!.activeCampaigns.map((c) => (
                                    <div key={c.id} className="rounded-lg border border-border bg-background p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold">{c.title}</p>
                                            <Badge variant="outline">{t('dashboard.postLinksCount', { count: c._count.post_links ?? 0 })}</Badge>
                                        </div>
                                        {c.end_date && <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.ends', { date: formatDate(c.end_date) })}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Link className="size-5 text-amber-500" />
                            {t('dashboard.recentPostLinks')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2 py-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                ))}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {[
                                            t('dashboard.colActor'),
                                            t('dashboard.colCampaign'),
                                            t('dashboard.colPlatform'),
                                            t('metrics.views'),
                                            t('metrics.likes'),
                                            t('dashboard.colUpdated'),
                                        ].map((h) => (
                                            <TableHead key={h}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(d?.recentAssignments ?? []).map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <span className="font-semibold">{row.actors?.name ?? `#${row.actor_id}`}</span>
                                            </TableCell>
                                            <TableCell>{row.campaigns?.title ?? `#${row.campaign_id}`}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{row.social_platforms?.name ?? `#${row.platform_id}`}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">{Number(row.latest_views).toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold text-green-600">{Number(row.latest_likes).toLocaleString()}</TableCell>
                                            <TableCell className="text-muted-foreground">{formatDate(row.updated_at)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(d?.recentAssignments?.length ?? 0) === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                {t('common:noData')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard
