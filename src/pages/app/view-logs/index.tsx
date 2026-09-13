import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ExternalLink, LayoutGrid, Table2 } from 'lucide-react'
import { useGetViewLogsQuery, useGetViewLogCampaignsQuery } from '../../../stores/services/viewLogApi'
import BackdropComponent from '../../../components/BackdropComponent'
import PaginationComponent from '../../../components/PaginationComponent'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useSearchParams } from 'react-router-dom'
import { formatDateTime } from '@/utils/datetime'

const VIEW_MODE_KEY = 'view-logs:display-mode'
type ViewMode = 'table' | 'cards'

const ViewLogsPage: React.FC = () => {
    const { t } = useTranslation('app')
    const [searchParams] = useSearchParams()
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try { return localStorage.getItem(VIEW_MODE_KEY) === 'cards' ? 'cards' : 'table' }
        catch { return 'table' }
    })
    const changeViewMode = (mode: ViewMode) => {
        setViewMode(mode)
        try { localStorage.setItem(VIEW_MODE_KEY, mode) } catch { /* Storage may be unavailable. */ }
    }
    const initialPostLinkId = searchParams.get('post_link_id') ? Number(searchParams.get('post_link_id')) : null

    const [page, setPage] = useState(1)
    const [postLinkId, setPostLinkId] = useState<number | null>(initialPostLinkId)
    const [campaignId, setCampaignId] = useState<number | undefined>(() => {
        const value = Number(searchParams.get('campaign_id'))
        return Number.isInteger(value) && value > 0 ? value : undefined
    })
    const { data: campaigns, isLoading: campaignsLoading, isError: campaignsFailed, refetch: reloadCampaigns } = useGetViewLogCampaignsQuery()
    const { currentData: logs, isFetching: isLoading, isError, refetch } = useGetViewLogsQuery({
        page, campaign_id: campaignId, post_link_id: postLinkId && postLinkId > 0 ? postLinkId : undefined
    })
    const rows = logs?.status === 'success' ? logs.data : []
    const total = logs?.status === 'success' ? logs.pagination : { totalItems: 0, totalPages: 0 }

    const formatOptional = (value: number | string | null | undefined) =>
        value == null ? '—' : Number(value).toLocaleString()

    return (
        <div>
            <BackdropComponent open={isLoading} />
            <PageHeader title={t('viewLogs.title')} />

            <div className="mb-4 flex flex-wrap items-end gap-2">
                <div className="w-full max-w-[360px] space-y-2">
                    <Label htmlFor="view-log-campaign">{t('viewLogs.colCampaign')}</Label>
                    <Select value={campaignId?.toString() ?? 'all'} disabled={campaignsLoading}
                        onValueChange={(value) => { setCampaignId(value === 'all' ? undefined : Number(value)); setPostLinkId(null); setPage(1) }}>
                        <SelectTrigger id="view-log-campaign"><SelectValue placeholder={t('viewLogs.allCampaigns')} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('viewLogs.allCampaigns')}</SelectItem>
                            {(campaigns?.status === 'success' ? campaigns.data : []).map(campaign => (
                                <SelectItem key={campaign.id} value={String(campaign.id)}>
                                    {campaign.campaign_code ? `${campaign.campaign_code} — ` : ''}{campaign.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(campaignsFailed || (campaigns && campaigns.status !== 'success')) && (
                        <button type="button" className="text-sm text-destructive underline" onClick={() => reloadCampaigns()}>{t('viewLogs.campaignLoadFailed')}</button>
                    )}
                </div>
                {/* <div className="w-full max-w-[360px] space-y-2">
                    <Label>{t('viewLogs.postLinkId')}</Label>
                    <Input
                        type="number"
                        min={1}
                        placeholder={t('viewLogs.allPostLinks')}
                        value={postLinkId ?? ''}
                        onChange={(event) => {
                            setPostLinkId(event.target.value ? Number(event.target.value) : null)
                            setPage(1)
                        }}
                    />
                </div> */}
                <Button variant="outline" onClick={() => refetch()}>
                    <Search className="size-4" />
                    {t('common:search')}
                </Button>
                <div className="flex items-center gap-1 rounded-lg border p-1 sm:ml-auto" role="group" aria-label={t('viewLogs.displayMode')}>
                    <Button type="button" size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} aria-pressed={viewMode === 'table'} onClick={() => changeViewMode('table')}>
                        <Table2 className="size-4" />{t('viewLogs.tableView')}
                    </Button>
                    <Button type="button" size="sm" variant={viewMode === 'cards' ? 'default' : 'ghost'} aria-pressed={viewMode === 'cards'} onClick={() => changeViewMode('cards')}>
                        <LayoutGrid className="size-4" />{t('viewLogs.cardView')}
                    </Button>
                </div>
            </div>

            {(isError || (logs && logs.status !== 'success')) && <p role="alert" className="mb-4 text-sm text-destructive">{t('viewLogs.loadFailed')}</p>}
            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((row) => {
                        const link = row.campaign_post_links
                        const assignment = link?.campaign_influencers
                        return (
                            <Card key={row.id} className="min-w-0 space-y-4 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="break-words font-semibold">{assignment?.actors?.name ?? '—'}</h2>
                                        <p className="mt-1 break-words text-sm text-muted-foreground">{assignment?.campaigns?.title ?? '—'}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">{link?.social_platforms?.name ?? '—'}</Badge>
                                </div>
                                {link?.post_url && (
                                    <a href={link.post_url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 text-sm text-primary hover:underline">
                                        <ExternalLink className="size-4 shrink-0" /><span className="truncate">{link.post_url}</span>
                                    </a>
                                )}
                                <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3">
                                    {[
                                        ['views', row.views_count], ['viewers', row.viewers_count],
                                        ['likes', row.likes_count], ['comments', row.comments_count],
                                        ['shares', row.shares_count], ['saves', row.saves_count], ['reposts', row.reposts_count],
                                    ].map(([metric, value]) => (
                                        <div key={metric} className="min-w-0">
                                            <dt className="text-xs text-muted-foreground">{t(`metrics.${metric}`)}</dt>
                                            <dd className="break-words text-lg font-semibold tabular-nums">{formatOptional(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                    <p>{t('viewLogs.colSource')}: {row.source ?? '—'}</p>
                                    <p>{t('common:date')}: {formatDateTime(row.checked_at)}</p>
                                </div>
                            </Card>
                        )
                    })}
                    {rows.length === 0 && !isLoading && <Card className="col-span-full p-8 text-center text-muted-foreground">{t('common:noDataShort')}</Card>}
                </div>
            ) : (
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[1180px]">
                    <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary">
                            {[
                                '#',
                                t('viewLogs.colActor'),
                                t('viewLogs.colCampaign'),
                                t('viewLogs.colPlatform'),
                                t('viewLogs.colPostUrl'),
                                t('metrics.views'),
                                t('metrics.viewers'),
                                t('metrics.likes'),
                                t('metrics.comments'),
                                t('metrics.shares'),
                                t('metrics.saves'),
                                t('metrics.reposts'),
                                t('viewLogs.colSource'),
                                t('common:date'),
                            ].map((h) => (
                                <TableHead key={h} className="text-primary-foreground">
                                    {h}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, i) => {
                            const link = row.campaign_post_links
                            const assignment = link?.campaign_influencers
                            return (
                                <TableRow key={row.id}>
                                    <TableCell>{(page - 1) * 25 + i + 1}</TableCell>
                                    <TableCell>{assignment?.actors?.name ?? '—'}</TableCell>
                                    <TableCell>{assignment?.campaigns?.title ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{link?.social_platforms?.name ?? '—'}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[160px] truncate">
                                        {link?.post_url ? (
                                            <a
                                                href={link.post_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                            >
                                                <ExternalLink className="size-3.5 shrink-0" />
                                                {link.post_url}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>{formatOptional(row.views_count)}</TableCell>
                                    <TableCell>{formatOptional(row.viewers_count)}</TableCell>
                                    <TableCell>{formatOptional(row.likes_count)}</TableCell>
                                    <TableCell>{formatOptional(row.comments_count)}</TableCell>
                                    <TableCell>{formatOptional(row.shares_count)}</TableCell>
                                    <TableCell>{formatOptional(row.saves_count)}</TableCell>
                                    <TableCell>{formatOptional(row.reposts_count)}</TableCell>
                                    <TableCell>{row.source ?? '—'}</TableCell>
                                    <TableCell>{formatDateTime(row.checked_at)}</TableCell>
                                </TableRow>
                            )
                        })}
                        {rows.length === 0 && !isLoading && (
                            <TableRow>
                                <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                                    {t('common:noDataShort')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
            </Card>
            )}
            <PaginationComponent page={page} setPage={setPage} total={total} />
        </div>
    )
}

export default ViewLogsPage
