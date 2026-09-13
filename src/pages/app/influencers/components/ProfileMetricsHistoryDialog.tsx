import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Loader2 } from 'lucide-react'
import {
    Actor,
    InfluencerSocialAccount,
    ProfileMetricSnapshot,
    useGetProfileMetricSnapshotsQuery,
} from '@/stores/services/actorApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import PaginationComponent from '@/components/PaginationComponent'
import { formatDateTime } from '@/utils/datetime'

const formatCount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '—'
    const num = Number(value)
    if (Number.isNaN(num)) return `${value}`
    return num.toLocaleString()
}

type Props = {
    actor: Actor | null
    account: InfluencerSocialAccount | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileMetricsHistoryDialog({ actor, account, open, onOpenChange }: Props) {
    const { t } = useTranslation('app')
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (open) setPage(1)
    }, [open, account?.uuid])

    const { data, isLoading, isFetching } = useGetProfileMetricSnapshotsQuery(
        {
            uuid: actor?.uuid ?? '',
            page,
            limit: 10,
            account_uuid: account?.uuid,
            platform: account?.platform,
        },
        { skip: !open || !actor?.uuid || !account?.uuid }
    )

    const rows: ProfileMetricSnapshot[] = data?.data ?? []
    const pagination = data?.meta?.pagination ?? {
        totalItems: rows.length,
        totalPages: 1,
        page,
        limit: 10,
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto sm:w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="size-5" />
                        {t('influencers.metricsHistory')}
                    </DialogTitle>
                </DialogHeader>

                {account ? (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className="capitalize">
                            {account.platform}
                        </Badge>
                        <span className="text-muted-foreground">{account.handle || account.profile_url}</span>
                    </div>
                ) : null}

                <div className="overflow-x-auto rounded-lg border">
                    <Table className="min-w-[640px]">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>{t('influencers.historyDate')}</TableHead>
                                <TableHead>{t('influencers.followers')}</TableHead>
                                <TableHead>{t('influencers.following')}</TableHead>
                                <TableHead>{t('influencers.historySource')}</TableHead>
                                <TableHead>{t('influencers.historyStatus')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(isLoading || isFetching) && rows.length === 0 ? (
                                <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 className="size-4 animate-spin" />
                                                {t('influencers.historyLoading')}
                                            </span>
                                        </TableCell>
                                </TableRow>
                            ) : null}

                            {rows.map((row) => (
                                <TableRow key={row.uuid}>
                                    <TableCell className="whitespace-nowrap text-xs">
                                        {formatDateTime(row.fetched_at)}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {formatCount(row.follower_count)}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                        {formatCount(row.following_count)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{row.source}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge
                                                variant={
                                                    row.status === 'success' ? 'default' : 'secondary'
                                                }
                                                className={
                                                    row.status === 'failed'
                                                        ? 'border-destructive/40 text-destructive'
                                                        : undefined
                                                }
                                            >
                                                {row.status}
                                            </Badge>
                                            {row.error_code ? (
                                                <div className="max-w-[220px]">
                                                    <p className="truncate text-[11px] font-medium text-destructive">
                                                        {row.error_code}
                                                    </p>
                                                    {row.error_message ? (
                                                        <p
                                                            className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground"
                                                            title={row.error_message}
                                                        >
                                                            {row.error_message}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {!isLoading && !isFetching && rows.length === 0 ? (
                                <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                             {t('influencers.historyEmpty')}
                                         </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        {t('common:close')}
                    </Button>
                    <PaginationComponent
                        page={page}
                        setPage={setPage}
                        total={{
                            totalItems: pagination.totalItems,
                            totalPages: pagination.totalPages,
                        }}
                        className="mb-0 justify-center sm:justify-end"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
